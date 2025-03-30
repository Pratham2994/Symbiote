import numpy as np

class MatchScoreCalculator:
    def __init__(self, weights=None, lambda_constant=0.5):
        # Default weights for Frontend, Backend, and EQ
        self.weights = weights or {
            "frontend": 0.375,
            "backend": 0.375,
            "eq": 0.25
        }
        self.lambda_constant = lambda_constant
        self.parameters = ["frontend", "backend", "eq"]
        self.mismatch_penalty = 0

    def calculate_combined_score(self, person_a_dict, person_b_dict):
        """
        Calculate match score between two candidates based on their scores
        
        Args:
            person_a_dict: dict with "frontend", "backend", "eq" scores
            person_b_dict: dict with "frontend", "backend", "eq" scores
            
        Returns:
            float: final match score
        """
        # Convert dictionaries to lists in correct order
        person_a = [person_a_dict.get(param, 0) for param in self.parameters]
        person_b = [person_b_dict.get(param, 0) for param in self.parameters]
        
        # Calculate combined scores
        combined_scores = []
        for i in range(len(self.parameters)):
            combined_scores.append((
                self.parameters[i],
                person_a[i] + person_b[i]
            ))
        
        self.mismatch_penalty = self._calculate_mismatch_penalty(person_a_dict, person_b_dict)

        return self._calculate_weighted_score(combined_scores)

    def _calculate_weighted_score(self, combined_scores):
        parameters, scores = zip(*combined_scores)
        weighted_values = []

        for param, score in zip(parameters, scores):
            weighted_values.append((
                param,
                self.weights[param] * score
            ))

        return self._calculate_variance(weighted_values)

    def _calculate_variance(self, weighted_scores):
        parameters, scores = zip(*weighted_scores)
        mean = sum(scores) / len(scores)

        variance_values = []
        for param, score in zip(parameters, scores):
            variance_values.append((
                param,
                pow((score - mean), 2)
            ))

        return self._calculate_penalty(variance_values, weighted_scores)

    def _calculate_penalty(self, variance_values, weighted_scores):
        _, values = zip(*variance_values)
        variance_mean = sum(values) / len(values)
        penalty = self.lambda_constant * variance_mean

        return self._calculate_final_score(penalty, weighted_scores)

    def _calculate_final_score(self, penalty, weighted_scores):
        _, values = zip(*weighted_scores)
        sum_weighted_score = sum(values)

        # print(self.mismatch_penalty)
        # print(sum_weighted_score, penalty)

        return sum_weighted_score - penalty - self.mismatch_penalty
    
    def _calculate_mismatch_penalty(self, person_a_dict, person_b_dict):
        mismatch_penalty = 0
        values_person_a = list(person_a_dict.values())
        values_person_b = list(person_b_dict.values())

        for i in range(3):
            mismatch_penalty += abs(values_person_a[i] - values_person_b[i])

        return self.lambda_constant * mismatch_penalty
    

# if __name__ == "__main__":
#     personA = {"frontend": 30, "backend": 25, "eq": 35}
#     personB = {"frontend": 50, "backend": 55, "eq": 60}

#     calculator = MatchScoreCalculator()
#     final_score = calculator.calculate_combined_score(personA, personB)
#     print("Final Match Score:", final_score)


