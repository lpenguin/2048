function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.sharingContainer = document.querySelector(".score-sharing");

  this.score = 0;
  this.images = {
    2: 'http://lpenguin.github.io/2048/images/G7ZOt7x8NpI.jpg',
    4: 'http://lpenguin.github.io/2048/images/0OGGjhWxWPE.jpg',
    8: 'http://lpenguin.github.io/2048/images/p0G1dJhyqLE.jpg',
    16: 'http://lpenguin.github.io/2048/images/aMhCMiPtjXY.jpg',
    32: 'http://lpenguin.github.io/2048/images/aVK0MdkAqto.jpg',
    64: 'http://lpenguin.github.io/2048/images/nIboJOCJNAU.jpg',
    128: 'http://lpenguin.github.io/2048/images/1jDP6_oQeKA.jpg',
    256: 'http://lpenguin.github.io/2048/images/MbR_tgAeSxc.jpg',
    512: 'http://lpenguin.github.io/2048/images/0fDUCgEVWpY.jpg',
    1024: 'http://lpenguin.github.io/2048/images/OjQAdqxgOrY.jpg',
    2048: 'http://lpenguin.github.io/2048/images/LISWEkD_1Po.jpg'
  }
  this.exists = {}

  for(var i in this.images){
    var src = this.images[i];
    var img=new Image();
    img.src=src;
  }
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "restart");
  }

  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");
  else {
    if(self.exists[tile.value] == undefined){
      var ptile = document.getElementById('piska'+tile.value);
      $(ptile).css('background-image', 'url('+self.images[tile.value]+')');
      var classList = ptile.className.split(' ')
      classList.push("piska-merged");
      ptile.setAttribute("class", classList.join(" "));
      self.exists[tile.value] = 1;
      ptile.textContent = tile.value;
    }
    
  }
  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  // inner.textContent = tile.value;

  // $(inner).css('background-image', 'url('+self.images[tile.value]+'); ')

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);
  // inner.style = 'display: table; '+
  //               'background-image: url("'+self.images[tile.value]+'"); '+
  //               'background-size: cover; '+
  //               'background-position: center center;'
  // inner.style.backgroundImage =' url('+self.images[tile.value]+'); ';

  $(inner).css('color', '#fff');
  $(inner).css('background-image', 'url('+self.images[tile.value]+')');
  $(inner).css('background-size', 'cover');
  $(inner).css('background-position', 'center center');

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";

  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "end", type, this.score);
  }

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;

  this.clearContainer(this.sharingContainer);
  this.sharingContainer.appendChild(this.scoreTweetButton());
  twttr.widgets.load();
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.scoreTweetButton = function () {
  var tweet = document.createElement("a");
  tweet.classList.add("twitter-share-button");
  tweet.setAttribute("href", "https://twitter.com/share");
  tweet.setAttribute("data-via", "gabrielecirulli");
  tweet.setAttribute("data-url", "http://git.io/2048");
  tweet.setAttribute("data-counturl", "http://gabrielecirulli.github.io/2048/");
  tweet.textContent = "Tweet";

  var text = "I scored " + this.score + " points at 2048, a game where you " +
             "join numbers to score high! #2048game";
  tweet.setAttribute("data-text", text);

  return tweet;
};
