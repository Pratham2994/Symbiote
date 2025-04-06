# match_score.py

class MatchScoreCalculator:
    def __init__(self, weights=None):
        """
        Initialize the calculator with custom weights.
        Only 'frontend' and 'backend' keys are used (eq is handled separately).
        If no weights provided, defaults to 0.5 for both.
        """
        if weights:
            # Use only frontend and backend; ignore extra keys.
            self.weights = {k: v for k, v in weights.items() if k in ['frontend', 'backend']}
            if 'frontend' not in self.weights:
                self.weights['frontend'] = 0.5
            if 'backend' not in self.weights:
                self.weights['backend'] = 0.5
        else:
            self.weights = {'frontend': 0.5, 'backend': 0.5}

    @staticmethod
    def get_band(score: int) -> int:
        """
        Returns the band number for a given score.
        Bands:
            Band 1: 0–35
            Band 2: 36–65
            Band 3: 66–85
            Band 4: 86–100
        """
        if 0 <= score <= 35:
            return 1
        elif 36 <= score <= 65:
            return 2
        elif 66 <= score <= 85:
            return 3
        elif 86 <= score <= 100:
            return 4
        else:
            raise ValueError("Score must be between 0 and 100")

    @staticmethod
    def compute_skill_contribution(score1: int, score2: int) -> (float, int, int):
        """
        Computes the contribution for a given skill based on the candidate scores.
        The base score is 50.
        Adjustments are made based on the band difference:
          - Same band (or borderline case): bonus of +15.
          - One band difference: bonus of +5.
          - Two band difference: penalty of -10.
          - Three or more band difference: penalty of -20.
        A borderline case (e.g. one candidate scoring 35 and the other 36)
        is treated as being in the same band.
        The final contribution is clamped between 0 and 100.
        
        Returns:
            contribution (float), band1 (int), band2 (int)
        """
        band1 = MatchScoreCalculator.get_band(score1)
        band2 = MatchScoreCalculator.get_band(score2)

        # Handle borderline edge case: e.g., 35 vs 36.
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
            else:  # abs_band_diff >= 3
                adjustment = -20

        contribution = 50 + adjustment
        contribution = max(0, min(100, contribution))
        return contribution, band1, band2

    def calculate_combined_score(self, candidate1_scores: dict, candidate2_scores: dict) -> float:
        """
        Calculates the overall match percentage between two candidates.
        
        For frontend and backend:
          1. Compute a contribution score for each skill.
          2. Apply a bonus if complementary strengths are detected.
          3. Aggregate using provided weights.
        
        For EQ (Team Chemistry):
          1. Calculate the average of both candidates’ EQ scores.
        
        The final match score is a weighted combination:
          - 75% weight for the combined frontend/backend score.
          - 25% weight for the EQ score.
        
        Finally, a linear transformation is applied to expand the range:
          scaled_score = 2 * final_score - 60,
        and then clamped to between 10 and 90.
        
        Returns:
            A float representing the overall match percentage (10–90).
        """
        # --- Frontend & Backend Calculation ---
        frontend_score1 = candidate1_scores.get("frontend", 0)
        frontend_score2 = candidate2_scores.get("frontend", 0)
        backend_score1 = candidate1_scores.get("backend", 0)
        backend_score2 = candidate2_scores.get("backend", 0)

        frontend_contrib, f_band1, f_band2 = self.compute_skill_contribution(frontend_score1, frontend_score2)
        backend_contrib, b_band1, b_band2 = self.compute_skill_contribution(backend_score1, backend_score2)

        # Detect complementary strengths:
        diff_frontend = frontend_score1 - frontend_score2
        diff_backend = backend_score1 - backend_score2
        complementary = diff_frontend * diff_backend < 0

        w_front = self.weights.get("frontend", 0.5)
        w_back = self.weights.get("backend", 0.5)
        total_weight = w_front + w_back

        overall_fb = (frontend_contrib * w_front + backend_contrib * w_back) / total_weight

        # Apply bonus if complementary strengths exist.
        if complementary:
            overall_fb += 30

        overall_fb = max(0, min(100, overall_fb))

        # --- EQ (Team Chemistry) Calculation ---
        eq1 = candidate1_scores.get("eq", 50)
        eq2 = candidate2_scores.get("eq", 50)
        # For EQ, we simply average the two scores.
        eq_avg = (eq1 + eq2) / 2

        # --- Final Weighted Combination ---
        fb_weight = 0.75
        eq_weight = 0.25

        final_score = overall_fb * fb_weight + eq_avg * eq_weight
        final_score = max(0, min(100, final_score))

        # --- Linear Transformation ---
        # Map the typical range [35,75] to [10,90].
        scaled_score = 2 * final_score - 60
        scaled_score = max(10, min(90, scaled_score))
        return scaled_score


# Updated test cases
if __name__ == "__main__":
    calculator = MatchScoreCalculator()
    
    # Test case 1: Similar intermediate skills
    person_a = {"frontend": 40, "backend": 40, "eq": 50}
    person_b = {"frontend": 40, "backend": 40, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 1 - Similar intermediate skills: {score:.2f}%")
    
    # Test case 2: Complementary skills
    person_a = {"frontend": 90, "backend": 30, "eq": 50}
    person_b = {"frontend": 30, "backend": 90, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 2 - Complementary skills: {score:.2f}%")
    
    # Test case 3: Well-rounded similar skills
    person_a = {"frontend": 60, "backend": 60, "eq": 50}
    person_b = {"frontend": 60, "backend": 60, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 3 - Well-rounded similar skills: {score:.2f}%")
    
    # Test case 4: Extreme skill gap
    person_a = {"frontend": 10, "backend": 10, "eq": 50}
    person_b = {"frontend": 90, "backend": 90, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 4 - Extreme skill gap: {score:.2f}%")
    
    # Test case 5: Well-balanced high skills
    person_a = {"frontend": 50, "backend": 90, "eq": 50}
    person_b = {"frontend": 90, "backend": 50, "eq": 50}
    score = calculator.calculate_combined_score(person_a, person_b)
    print(f"Test 5 - Well-balanced high skills: {score:.2f}%")
    
    # Test case 6: High vs low skills
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
