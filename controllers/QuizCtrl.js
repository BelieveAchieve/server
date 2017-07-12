module.exports = {
  createQuiz: function(options, callback){
    var all_questions = [{
      // Question 1
      question_string: "Which State's motto is, 'Live Free or Die'?",
      choices: {
        correct: "New Hampshire",
        wrong: ["Connecticut", "Massechussets", "Pennsylvania"]
      }
    }, {
      // Question 2
      question_string: "Walt Disney was the creator of which popular animated cartonn character?",
      choices: {
        correct: "Mickey Mouse",
        wrong: ["Betty Boop", "Bugs Bunny", "Garfield"]
      }
    }, {
      // Question 3
      question_string: "Who was the first woman to fly across the Atlantic Ocean alone?",
      choices: {
        correct: "Amelia Earhart",
        wrong: ["Elizabeth Cady Stanton", "Marie Curie", "Margeret Michelle"]
      }
    }];

    // An object for a Quiz, which will contain Question objects.
    var Quiz = function(quiz_name) {
      // Private fields for an instance of a Quiz object.
      this.quiz_name = quiz_name;
      this.current_question_index = 0;
      this.questions = [];
    }

    // A function that you can enact on an instance of a quiz object. This function is called add_question() and takes in a Question object which it will add to the questions field.
    Quiz.prototype.add_question = function(question) {
      // Randomly choose where to add question
      var index_to_add_question = Math.floor(Math.random() * this.questions.length);
      this.questions.splice(index_to_add_question, 0, question);
    }

    // An object for a Question, which contains the question, the correct choice, and wrong choices. This block is the constructor.
    var Question = function(question_string, correct_choice, wrong_choices) {
      // Private fields for an instance of a Question object.
      this.question_string = question_string;
      this.choices = [];
      this.user_choice_index = null; // Index of the user's choice selection

      // Random assign the correct choice an index
      this.correct_choice_index = Math.floor(Math.random() * wrong_choices.length + 1);

      // Fill in this.choices with the choices
      var number_of_choices = wrong_choices.length + 1;
      for (var i = 0; i < number_of_choices; i++) {
        if (i === this.correct_choice_index) {
          this.choices[i] = correct_choice;
        } else {
          // Randomly pick a wrong choice to put in this index
          var wrong_choice_index = Math.floor(Math.random(0, wrong_choices.length));
          this.choices[i] = wrong_choices[wrong_choice_index];

          // Remove the wrong choice from the wrong choice array so that we don't pick it again
          wrong_choices.splice(wrong_choice_index, 1);
        }
      }
    }

    var quiz = new Quiz('My Quiz');

    // Create Question objects from all_questions and add them to the Quiz object
    for (var i = 0; i < all_questions.length; i++) {
      // Create a new Question object
      var question = new Question(all_questions[i].question_string, all_questions[i].choices.correct, all_questions[i].choices.wrong);

      // Add the question to the instance of the Quiz object that we created previously
      quiz.add_question(question);
    }
    console.log('quiz reached end of quiz controller');
    return quiz;
  }
}
