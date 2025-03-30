import numpy as np

# Define question-to-parameter weight mapping
SCORING_MATRIX = {
    "Q1": {
        1: [-2, 0, +2, -1, -2, +2],
        2: [+1, 0, +2, 0, +1, +1],
        3: [+3, 0, +1, +2, +2, 0],
        4: [+1, 0, 0, 0, +1, -2],
        5: [+3, 0, -1, +1, +3, -3]
    },
    "Q2": {
        1: [-3, +1, 0, 0, -3, -3],
        2: [0, +1, +1, 0, 0, 0],
        3: [+3, -2, 0, +2, +1, +3],
        4: [+2, -3, -2, 0, 0, +2],
        5: [+1, +1, +2, +1, +2, 0]
    },
    "Q3": {
        1: [-3, -2, -2, -3, -3, -3],
        2: [+1, 0, +2, 0, 0, +1],
        3: [+2, 0, +3, +3, +1, +2],
        4: [+2, 0, +1, +2, +2, -1],
        5: [-3, -3, +4, +3, 0, +3]
    },
    "Q4": {
        1: [-2, 0, +2, -1, -2, +2],
        2: [0, 0, +1, 0, 0, +1],
        3: [+2, 0, +2, 0, +3, +1],
        4: [+3, 0, +1, +1, +2, -1],
        5: [+1, 0, -2, 0, +1, -3]
    },
}

PARAMETERS = ["Teamwork", "Pressure Handling", "Problem Solving", "Adaptability", "Temperament", "Leadership"]

# Define the questions and choices
QUESTIONS = {
    "Q1": {
        "text": "Your team members disagree on an approach. What do you do?",
        "choices": [
            "1️⃣ Stick with your own idea and push forward.",
            "2️⃣ Explain your approach logically and let the team decide.",
            "3️⃣ Try to merge ideas into a compromise.",
            "4️⃣ Let others take the lead while you execute.",
            "5️⃣ Drop your idea to maintain harmony."
        ]
    },
    "Q2": {
        "text": "A teammate is struggling to complete their task. How do you react?",
        "choices": [
            "1️⃣ Ignore it and focus on your part.",
            "2️⃣ Suggest they try looking at documentation.",
            "3️⃣ Offer to split their workload and help.",
            "4️⃣ Fully take over their task.",
            "5️⃣ Encourage them but let them figure it out."
        ]
    },
    "Q3": {
        "text": "The hackathon has a last-minute rule change. What do you do?",
        "choices": [
            "1️⃣ Panic and stick to the original plan.",
            "2️⃣ Suggest adjusting a small part of the project.",
            "3️⃣ Quickly brainstorm with the team for an alternative.",
            "4️⃣ Let the team decide and go with the flow.",
            "5️⃣ Insist on starting over for a perfect solution."
        ]
    },
    "Q4": {
        "text": "A teammate criticizes your code. What is your response?",
        "choices": [
            "1️⃣ Defend it and explain why it's correct.",
            "2️⃣ Ask for clarification but stick to your way if unconvinced.",
            "3️⃣ Consider their point and modify it if reasonable.",
            "4️⃣ Accept their suggestion and apply it.",
            "5️⃣ Let them rewrite the code however they want."
        ]
    }
}

def calculate_eq_score(responses):
    """
    Calculate EQ score based on user responses (1-5) for each question.
    """
    # Initialize parameter scores
    parameter_scores = np.zeros(6)

    # Apply scoring matrix
    for q, response in responses.items():
        parameter_scores += np.array(SCORING_MATRIX[q][response])

    # Normalize scores between 0-100
    min_score, max_score = np.min(parameter_scores), np.max(parameter_scores)
    normalized_scores = ((parameter_scores - min_score) / (max_score - min_score)) * 100

    # Compute final EQ score (average of all parameters)
    final_eq_score = np.mean(normalized_scores)

    return {PARAMETERS[i]: round(normalized_scores[i], 2) for i in range(6)}, round(final_eq_score, 2)

def get_user_responses():
    responses = {}
    for q_key, q_content in QUESTIONS.items():
        print("\n" + q_content["text"])
        for choice in q_content["choices"]:
            print(choice)
        # Input validation loop
        while True:
            try:
                answer = int(input("Enter your choice (1-5): "))
                if answer < 1 or answer > 5:
                    print("Please enter a valid number between 1 and 5.")
                    continue
                responses[q_key] = answer
                break
            except ValueError:
                print("Invalid input. Please enter a number between 1 and 5.")
    return responses

if __name__ == "__main__":
    # Get user responses
    user_responses = get_user_responses()
    
    # Calculate EQ scores
    eq_breakdown, eq_final = calculate_eq_score(user_responses)
    
    # Display results
    print("\nEQ Parameter Breakdown:", eq_breakdown)
    print("Final EQ Score:", eq_final)
