import numpy as np

lambda_constant = 0.5

def calculate_combined_score(personA, personB):
    score = []
    parameters = ["Frontend", "Backend", "EQ"]
    for i in range(3):
        score.append(personA[i] + personB[i])

    combined_score = list(zip(parameters, score))

    return calculate_weighted_score(combined_score)


def calculate_weighted_score(combined_score):
    parameters, score = zip(*combined_score)
    ratio = [0.375, 0.375, 0.25]
    values = []

    for i in range(3):
        values.append(ratio[i] * score[i])

    weighted_score = list(zip(parameters, values))

    return calculate_variance(weighted_score)


def calculate_variance(weighted_score):
    parameters, score = zip(*weighted_score)
    mean = sum(score) / 3;

    values = []
    for i in range(3):
        values.append(pow((score[i] - mean), 2))
    
    variance = list(zip(parameters, values))
    weighted_score = list(zip(parameters, score))

    return calculate_penalty(variance, weighted_score)


def calculate_penalty(variance, weighted_score):
    weighted_score = list(weighted_score)
    parameters, values = zip(*variance)
    variance_mean = sum(values) / 3;
    
    penalty = lambda_constant * variance_mean

    return final_score(penalty, weighted_score)


def final_score(penalty, weighted_score):
    parameters, values = zip(*weighted_score)
    sum_weighted_score = sum(values);

    result = sum_weighted_score - penalty
    return result

if __name__ == "__main__":

    personA = [90, 20, 50]
    personB = [20, 90, 50]

    print("Final Score: ", calculate_combined_score(personA, personB))

# print(list(calculate_combined_score(personA, personB)))
# print(list(calculate_weighted_score(calculate_combined_score(personA, personB))))
# print(list(calculate_variance(calculate_weighted_score(calculate_combined_score(personA, personB)))))
# print(calculate_penalty(list(calculate_variance(calculate_weighted_score(calculate_combined_score(personA, personB))))))
# print(final_score(calculate_weighted_score(calculate_combined_score(personA, personB)), 29.340277777777775))
