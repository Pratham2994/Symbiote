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
        return sum_weighted_score - penalty

