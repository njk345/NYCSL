$(function() {
	$('.dropdown-toggle').dropdown();
	$('.dropdown input, .dropdown label').click(function(e) {
		e.stopPropagation();
	});

	var messageBox = {
		$messageBox: $("#messageBox"),
		verifySuccess: function() {
			$messageBox.empty()
			$messageBox.append($("<div class='alert alert-success alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Email Verification Success.</strong>&nbsp;&nbsp;Your email has been verified. You may now log in.</div>"))
		},
		verifyError: function() {
			$messageBox.empty()
			$messageBox.append($("<div class='alert alert-danger alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Email Verification Failed.</strong>&nbsp;&nbsp;There was a problem verifying your email.</div>"))
		},
		recoverPasswordSuccess: function() {
			$messageBox.empty()
			$messageBox.append($("<div class='alert alert-info alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Password Changed.</strong>&nbsp;&nbsp;You successfully changed your password!</div>"))
		},
		recoverPasswordError: function() {
			$messageBox.empty()
			$messageBox.append($("<div class='alert alert-danger alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Password Change Failed.</strong>&nbsp;&nbsp;There was a problem changing your password. If this issue is persistent, email <a href='mailto:contact@nycsl.io'>contact@nycsl.io</a>.</div>"))
		}
	}

	function GameDropdown(user, $parentField) {
		this.setGames = function(games) {
			this.games = games;
			this.render();
			this.hide();
			console.log("Done set")
		};
		this.render = function() {
			this.$parentField.find(".gameRow").remove();
			for(var a = 0; a < this.games.length; a++) {
				var opponent = this.games[a].users[0].userID == this.user.userID ? this.games[a].users[1] : this.games[a].users[0];
				var gameResult = opponent.rank === "0" ? "Lost" : "Won";

				this.$parentField.append("<tr class='gameRow'><td></td><td>vs <a href='student.php?userID="+opponent.userID+"'>"+opponent.firstName+" "+opponent.lastName+"</a></td><td><a href='school.php?schoolName="+opponent.schoolName+"'>"+opponent.schoolName+"</a></td><td>"+gameResult+"</td></tr>");
			}
		};
		this.toggle = function() {
			console.log("toggle")
			if(this.isShown == true) this.hide();
			else this.show();
		};
		this.hide = function() {
			this.isShown = false;
			this.$parentField.find(".gameRow").css("display", "none");
		};
		this.show = function() {
			this.isShown = true;
			this.$parentField.find(".gameRow").css("display", "table-row");
		};
		this.displayGame = function(event) {
			var gameID = $(event.target).attr("gameID");
			var game = null;
			for(var a = 0; a < this.games.length; a++) {
				if(this.games[a].gameID == gameID) game = this.games[a];
			}
			var users = game.users;
			users.sort(function(a, b) {
				return a.playerIndex > b.playerIndex;
			});
			console.log(users);
			gameDisplay.setGame(users[0].firstName + " " + users[0].lastName, users[1].firstName + " " + users[1].lastName, getGameFile(game.replayFilename));
		};

		this.user = user;
		this.$parentField = $parentField;
		console.log("bind")
		$(document).on("click", ".gameLink"+this.user.userID, this.displayGame.bind(this));
	}

	var table = {
		init: function(submissions, isLatestGame) {
			this.isLatestGame = isLatestGame;
			console.log("is " + this.isLatestGame)

			this.cacheDOM();
			this.bindEvents();
			this.setSubmissions(submissions);
		},
		cacheDOM: function() {
			this.$table = $("#leaderTable")
		},
		bindEvents: function() {
			$(document).on("click", ".matchDrop", this.toggleDropdown.bind(this));
		},
		setSubmissions: function(submissions) {
			this.submissions = submissions;

			this.render();

			if(this.isLatestGame) {
				this.dropdowns = Array();
				for(var a = 0; a < this.submissions.length; a++) this.dropdowns.push(new GameDropdown(this.submissions[a].user, $("#user"+this.submissions[a].user.userID)));
			}
		},
		render: function() {
			var curve = 0; // curve uniformly pushes up avg to 87
			this.submissions.forEach(function(submission) {
				curve += parseInt(submission.score);
			}); 
			curve /= this.submissions.length;
			curve = 87 - curve;

			this.$table.empty();
			for(var a = 0; a < this.submissions.length; a++) {
				var user = this.submissions[a].user;
				var score = this.submissions[a].score;
				this.$table.append("<tbody id='user" + user.userID + "'><tr><th scope='row'>"+(a+1)+"</th><td><a href='student.php?userID="+user.userID+"'>"+user.firstName+" "+user.lastName+"</a></td><td><a href='school.php?schoolName="+user.schoolName+"'>"+user.schoolName+"</a></td><td>"+score+"</td></tr></tbody>");
			}
		},
		toggleDropdown: function(event) {
			if(this.isLatestGame) {
				console.log(event)
				var user = this.getUserWithID($(event.target).attr("userID"));
				console.log(user)
				for(var a = 0; a < this.submissions.length; a++) {
					if(this.submissions[a].user.userID == user.userID) {
						if(this.dropdowns[a].games == null) {
							$('<div id="overlay"><img id="loading" src="http://bit.ly/pMtW1K"></div>').prependTo('body');
							this.dropdowns[a].setGames(getLatestGamesForUser(user.userID));
							$('#overlay').remove();
						} this.dropdowns[a].toggle();
						break;
					}
				}
			}
		},
		getUserWithID: function(userID) {
			for(var a = 0; a < this.submissions.length; a++) if(this.submissions[a].user.userID == userID) return this.submissions[a].user;
			return getUser(userID);
		}
	};

	var problemDisplay = {
		init: function(problem, isLatestGame) {
			this.problem = problem;

			this.table = table;
			this.table.init(this.problem.submissions, isLatestGame);

			this.cacheDOM();
			this.render();
		},
		cacheDOM: function() {
			this.$header = $("#jHeader");
			this.$paragraph = $("#jParagraph");
			this.$rulesPanel = $("#rulesPanelBody");
		},
		setProblem: function(problem) {
			this.problem = problem;
			this.table.setSubmissions(problem.submissions);
			this.render();
		},
		render: function() {
			this.$header.html(this.problem.problemFullName);
			this.$paragraph.html(this.problem.problemDescription);

			var result = $.ajax({
				url: "problems/descriptions/"+this.problem.problemName+".html",
				async: true,
				method: "GET",
				context: this,
				success: function(result) {
					this.$rulesPanel.html(result);
				}
			});
		},
	};

	var problemPanner = {
		init: function(startingIndex) {
			this.problemIndex = startingIndex;
			this.problemSize = getProblemsSize();

			this.cacheDOM();
			this.bindEvents();
		},
		cacheDOM: function() {
			this.$backButton = $("#backButton");
			this.$forwardButton = $("#nextButton");
			this.$archivedTag = $("archivedTag");

			this.problemDisplay = problemDisplay;
			this.problemDisplay.init(getProblemWithIndex(this.problemIndex), this.problemIndex == 0);

			if(this.problemIndex == 0) {
				this.$forwardButton.css("visibility", "hidden");
				this.$archivedTag.css("display", "none");
			}
			if(this.problemIndex == this.problemSize-1) {
				this.$backButton.css("visibility", "visible");
			}
		},
		bindEvents: function() {
			this.$backButton.click(this, this.moveBack.bind(this));
			this.$forwardButton.click(this, this.moveForward.bind(this));
		},
		render: function() {
			this.problemDisplay.setProblem(getProblemWithIndex(this.problemIndex));
		},
		moveBack: function() {
			this.problemIndex++;
			if(this.problemIndex == this.problemSize-1) {
				this.$backButton.css("visibility", "hidden");
			}
			if(this.problemIndex == 1) {
				this.$forwardButton.css("visibility", "visible");
				this.$archivedTag.css("display", "block");
			}

			this.render();
		},
		moveForward: function() {
			this.problemIndex--;
			if(this.problemIndex == 0) {
				this.$forwardButton.css("visibility", "hidden");
				this.$archivedTag.css("display", "none");
			}
			if(this.problemIndex == this.problemSize-2) {
				this.$backButton.css("visibility", "visible");
			}

			this.render();
		}
	};

	// Get problem index from GET parameter
	var index = parseInt(getGET("problemIndex"));
	if(isNaN(index) == true || index == null || index == undefined) {
		index = parseInt(getGET("problemID"));
		if(isNaN(index) == true || index == null || index == undefined) {
			index = 0;
		} else {
			index = problemIDToIndex(index);
		}
	}

	problemPanner.init(index);

	if(getGET("didVerify") != null) messageBox.verifySuccess()
	if(getGET("didNotVerify") != null) messageBox.verifyError()
	if(getGET("didRecover") != null) messageBox.recoverPasswordSuccess()
	if(getGET("didNotRecover") != null) messageBox.recoverPasswordError()

	renderMathInElement(document.getElementById("rulesPanelBody"));
});
