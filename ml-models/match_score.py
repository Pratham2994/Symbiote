# match_score.py

class MatchScoreCalculator:
    def __init__(self, weights=None):
        if weights:
            self.weights = {k: v for k, v in weights.items() if k in ['frontend', 'backend']}
            if 'frontend' not in self.weights:
                self.weights['frontend'] = 0.5
            if 'backend' not in self.weights:
                self.weights['backend'] = 0.5
        else:
            self.weights = {'frontend': 0.5, 'backend': 0.5}

    @staticmethod
    def get_band(score: int) -> int:
        if 0 <= score <= 36:
            return 1
        elif 36 < score <= 66:
            return 2
        elif 66 < score <= 86:
            return 3
        elif 86 < score <= 100:
            return 4
        else:
            print(f"Score: {score} is out of range")
            raise ValueError("Score must be between 0 and 100")

    @staticmethod
    def compute_skill_contribution(score1: int, score2: int) -> (float, int, int):
        band1 = MatchScoreCalculator.get_band(score1)
        band2 = MatchScoreCalculator.get_band(score2)

        if abs(score1 - score2) == 1 and (
            (score1 == 35 and score2 == 36) or (score1 == 36 and score2 == 35)
        ):
            adjustment = 15
        else:
            abs_band_diff = abs(band1 - band2)
            if abs_band_diff == 0:
                adjustment = 15
            elif abs_band_diff == 1:
                adjustment = 5
            elif abs_band_diff == 2:
                adjustment = -10
            else: 
                adjustment = -20

        contribution = 50 + adjustment
        contribution = max(0, min(100, contribution))
        return contribution, band1, band2

    def calculate_combined_score(self, candidate1_scores: dict, candidate2_scores: dict) -> float:
        frontend_score1 = candidate1_scores.get("frontend", 0)
        frontend_score2 = candidate2_scores.get("frontend", 0)
        backend_score1 = candidate1_scores.get("backend", 0)
        backend_score2 = candidate2_scores.get("backend", 0)

        frontend_contrib, f_band1, f_band2 = self.compute_skill_contribution(frontend_score1, frontend_score2)
        backend_contrib, b_band1, b_band2 = self.compute_skill_contribution(backend_score1, backend_score2)

        w_front = self.weights.get("frontend", 0.5)
        w_back = self.weights.get("backend", 0.5)
        total_weight = w_front + w_back
        overall_fb_base = (frontend_contrib * w_front + backend_contrib * w_back) / total_weight

        diff_frontend = frontend_score1 - frontend_score2
        diff_backend = backend_score1 - backend_score2
        complementary = diff_frontend * diff_backend < 0
        avg_diff = (abs(diff_frontend) + abs(diff_backend)) / 2
        
        bonus = 0
        if complementary and avg_diff >= 15:
            bonus = min((avg_diff / 100) * 70, 45)
        
        overall_fb = overall_fb_base + bonus
        overall_fb = max(0, min(100, overall_fb))

        eq1 = candidate1_scores.get("eq", 50)
        eq2 = candidate2_scores.get("eq", 50)
        eq_avg = (eq1 + eq2) / 2

        fb_weight = 0.75
        eq_weight = 0.25
        final_score = overall_fb * fb_weight + eq_avg * eq_weight
        final_score = max(0, min(100, final_score))

        scaled_score = 2 * final_score - 60
        scaled_score = max(10, min(90, scaled_score))
        return scaled_score



if __name__ == "__main__":
    calculator = MatchScoreCalculator()
    
    # Test case 1: Similar intermediate skills
    person_a = {"frontend": 40, "backend": 40, "eq": 50}
    person_b = {"frontend": 40, "backend": 40, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 1 - Similar intermediate skills: {score:.2f}%")
    
    # Test case 2: Complementary skills (extreme)
    person_a = {"frontend": 90, "backend": 30, "eq": 50}
    person_b = {"frontend": 30, "backend": 90, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 2 - Complementary skills (extreme): {score:.2f}%")
    
    # Test case 3: Well-rounded similar skills
    person_a = {"frontend": 60, "backend": 60, "eq": 50}
    person_b = {"frontend": 60, "backend": 60, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 3 - Well-rounded similar skills: {score:.2f}%")
    
    # Test case 4: Extreme skill gap (non-complementary)
    person_a = {"frontend": 10, "backend": 10, "eq": 50}
    person_b = {"frontend": 90, "backend": 90, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 4 - Extreme skill gap (non-complementary): {score:.2f}%")
    
    # Test case 5: Well-balanced high skills with crossover
    person_a = {"frontend": 50, "backend": 90, "eq": 50}
    person_b = {"frontend": 90, "backend": 50, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 5 - Well-balanced high skills: {score:.2f}%")
    
    # Test case 6: High vs low skills (non-complementary)
    person_a = {"frontend": 70, "backend": 70, "eq": 50}
    person_b = {"frontend": 30, "backend": 30, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 6 - High vs low skills: {score:.2f}%")
    
    # Test case 7: Complementary low skills
    person_a = {"frontend": 60, "backend": 20, "eq": 50}
    person_b = {"frontend": 20, "backend": 60, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 7 - Complementary low skills: {score:.2f}%")
    
    # Test case 8: Complementary high skills
    person_a = {"frontend": 85, "backend": 20, "eq": 50}
    person_b = {"frontend": 20, "backend": 85, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 8 - Complementary high skills: {score:.2f}%")
    
    # Test case 9: Balanced mid-level team
    person_a = {"frontend": 50, "backend": 50, "eq": 50}
    person_b = {"frontend": 50, "backend": 50, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 9 - Balanced mid-level team: {score:.2f}%")
    
    # Additional Test Cases:
    # Test case 10: Slight complementary difference (avg_diff < 15 -> no bonus)
    person_a = {"frontend": 55, "backend": 45, "eq": 50}
    person_b = {"frontend": 45, "backend": 55, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 10 - Slight complementary difference: {score:.2f}%")
    
    # Test case 11: Moderate complementary differences
    person_a = {"frontend": 80, "backend": 60, "eq": 50}
    person_b = {"frontend": 60, "backend": 80, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 11 - Moderate complementary differences: {score:.2f}%")
    
    # Test case 12: Nearly identical scores (no complementary bonus)
    person_a = {"frontend": 70, "backend": 70, "eq": 50}
    person_b = {"frontend": 70, "backend": 70, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 12 - Nearly identical scores: {score:.2f}%")
    
    # Test case 13: Extreme gap in both skills (non-complementary)
    person_a = {"frontend": 70, "backend": 30, "eq": 70}
    person_b = {"frontend": 35.71, "backend": 45.57, "eq": 43.75}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 13 - Extreme gap in both skills: {score:.2f}%")
