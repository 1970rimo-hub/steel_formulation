import torch
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymoo.core.problem import ElementwiseProblem
from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.optimize import minimize
from pymoo.termination import get_termination

app = Flask(__name__)
CORS(app)

# ----------------------------------------------------------------
# METALLURGICAL LOGIC: Chemical -> Property Mapping
# ----------------------------------------------------------------
# Elements: 0:C, 1:Mn, 2:Si, 3:Cr, 4:Ni, 5:Mo
ELEMENT_NAMES = ["Carbon", "Manganese", "Silicon", "Chromium", "Nickel", "Molybdenum"]

class SteelOptimizationProblem(ElementwiseProblem):
    def __init__(self, min_strength=600, max_cost=350):
        # n_var=6 (The 6 elements), n_obj=2 (Strength & Cost), n_constr=2
        super().__init__(n_var=6, n_obj=2, n_constr=2, xl=0.01, xu=1.0)
        self.min_strength_req = min_strength
        self.max_cost_req = max_cost

    def _evaluate(self, x, out, *args, **kwargs):
        # 1. Physics-based Surrogate (Mocking real metallurgical trends)
        # Strength: Carbon (x0) and Moly (x5) have highest impact
        strength = 250 + (x[0] * 700) + (x[1] * 120) + (x[3] * 80) + (x[5] * 250)
        
        # Cost: Nickel (x4) and Moly (x5) are the most expensive
        cost = 180 + (x[0] * 5) + (x[1] * 15) + (x[3] * 180) + (x[4] * 450) + (x[5] * 600)
        
        # Ductility: Carbon (x0) and Manganese (x1) reduce ductility
        ductility = 35 - (x[0] * 25) - (x[1] * 8)

        # 2. Objectives: (Minimize -Strength, Minimize Cost)
        f1 = -strength 
        f2 = cost

        # 3. Constraints (Pymoo constraints are satisfied if <= 0)
        # Constraint 1: Strength must be >= user target
        g1 = self.min_strength_req - strength
        # Constraint 2: Ductility must be at least 12%
        g2 = 12 - ductility

        out["F"] = [f1, f2]
        out["G"] = [g1, g2]

# ----------------------------------------------------------------
# ROUTES
# ----------------------------------------------------------------
@app.route('/')
def health_check():
    return jsonify({"status": "online", "message": "Steel AI Solver Active"})

@app.route('/optimize', methods=['POST'])
def run_optimization():
    try:
        # Get dynamic constraints from the React Dashboard Sliders
        data = request.json or {}
        min_s = float(data.get('min_strength', 600))
        max_c = float(data.get('max_cost', 400))

        # Setup Solver
        problem = SteelOptimizationProblem(min_strength=min_s, max_cost=max_c)
        algorithm = NSGA2(pop_size=50) # 50 candidate solutions per run
        termination = get_termination("n_gen", 40)

        res = minimize(problem, algorithm, termination, seed=1, verbose=False)

        if res.X is not None:
            results = []
            for i in range(len(res.X)):
                # Calculate metrics for the return object
                x = res.X[i]
                # Re-calculate stats for reporting
                strength = 250 + (x[0] * 700) + (x[1] * 120) + (x[3] * 80) + (x[5] * 250)
                cost = 180 + (x[0] * 5) + (x[1] * 15) + (x[3] * 180) + (x[4] * 450) + (x[5] * 600)
                
                results.append({
                    "composition": x.tolist(), # [C, Mn, Si, Cr, Ni, Mo]
                    "objectives": [float(res.F[i][0]), float(res.F[i][1])],
                    "metrics": {
                        "strength": float(strength),
                        "cost": float(cost),
                        "stability": float(0.98 - (x[0] * 0.05)) # Mock metallurgical stability
                    }
                })

            return jsonify({
                "status": "success",
                "solutions": results
            })
        
        return jsonify({"status": "error", "message": "Optimization failed to converge"}), 400

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

#if __name__ == '__main__':
#    app.run(host='0.0.0.0', port=5000)

if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", 5000))  # Use Render's dynamic PORT
    app.run(host='0.0.0.0', port=port)
