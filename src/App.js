import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Users, DollarSign, Clock, Trophy, Target, BookOpen } from 'lucide-react';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('menu'); // menu, lobby, playing
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [gameData, setGameData] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showResults, setShowResults] = useState(false);
  const [lastAnswer, setLastAnswer] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('general');
  const [showStats, setShowStats] = useState(false);
  const [playerStats, setPlayerStats] = useState({});

  const difficulties = ['easy', 'medium', 'hard'];
  const categories = ['general', 'finance', 'marketing', 'strategy', 'operations'];

  const boardSpaces = [
    'GO', 'Old Kent Road', 'Community Chest', 'Whitechapel Road', 'Income Tax',
    'King\'s Cross Station', 'The Angel Islington', 'Chance', 'Euston Road', 'Pentonville Road',
    'Jail', 'Pall Mall', 'Electric Company', 'Whitehall', 'Northumberland Avenue',
    'Marylebone Station', 'Bow Street', 'Community Chest', 'Marlborough Street', 'Vine Street',
    'Free Parking', 'The Strand', 'Chance', 'Fleet Street', 'Trafalgar Square',
    'Fenchurch St Station', 'Leicester Square', 'Coventry Street', 'Water Works', 'Piccadilly',
    'Go To Jail', 'Regent Street', 'Oxford Street', 'Community Chest', 'Bond Street',
    'Liverpool St Station', 'Chance', 'Park Lane', 'Super Tax', 'Mayfair'
  ];

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('roomCreated', (code) => {
      setRoomCode(code);
      setGameState('lobby');
    });

    newSocket.on('roomJoined', ({ roomCode: code, players: roomPlayers }) => {
      setRoomCode(code);
      setPlayers(roomPlayers);
      setGameState('lobby');
    });

    newSocket.on('playersUpdated', (roomPlayers) => {
      setPlayers(roomPlayers);
    });

    newSocket.on('gameStarted', (data) => {
      setGameData(data);
      setGameState('playing');
    });

    newSocket.on('gameUpdated', (data) => {
      setGameData(data);
      setCurrentPlayer(data.currentPlayer);
    });

    newSocket.on('questionReceived', (questionData) => {
      setQuestion(questionData);
      setSelectedAnswer(null);
      setTimeLeft(questionData.timeLimit || 30);
      setShowResults(false);
      setLastAnswer(null);
    });

    newSocket.on('answerResult', (result) => {
      setLastAnswer(result);
      setShowResults(true);
      setTimeLeft(0);
    });

    newSocket.on('statsUpdated', (stats) => {
      setPlayerStats(stats);
    });

    newSocket.on('timerTick', (time) => {
      setTimeLeft(time);
    });

    return () => newSocket.close();
  }, []);

  const createRoom = () => {
    if (playerName.trim()) {
      socket.emit('createRoom', { playerName: playerName.trim(), difficulty, category });
    }
  };

  const joinRoom = () => {
    if (playerName.trim() && roomCode.trim()) {
      socket.emit('joinRoom', { 
        roomCode: roomCode.trim(), 
        playerName: playerName.trim() 
      });
    }
  };

  const startGame = () => {
    socket.emit('startGame', roomCode);
  };

  const rollDice = () => {
    socket.emit('rollDice', roomCode);
  };

  const answerQuestion = () => {
    if (selectedAnswer !== null) {
      socket.emit('answerQuestion', { 
        roomCode, 
        answerIndex: selectedAnswer 
      });
    }
  };

  const changeDifficulty = (newDifficulty) => {
    setDifficulty(newDifficulty);
    if (socket && roomCode) {
      socket.emit('changeDifficulty', { roomCode, difficulty: newDifficulty });
    }
  };

  const changeCategory = (newCategory) => {
    setCategory(newCategory);
    if (socket && roomCode) {
      socket.emit('changeCategory', { roomCode, category: newCategory });
    }
  };

  const getPlayerPosition = (position) => {
    const corners = [0, 10, 20, 30];
    if (corners.includes(position)) {
      const cornerPositions = {
        0: { bottom: '0', right: '0' },
        10: { bottom: '0', left: '0' },
        20: { top: '0', left: '0' },
        30: { top: '0', right: '0' }
      };
      return cornerPositions[position];
    }

    if (position < 10) {
      return { bottom: '0', right: `${(10 - position) * 10}%` };
    } else if (position < 20) {
      return { left: '0', bottom: `${(position - 10) * 10}%` };
    } else if (position < 30) {
      return { top: '0', left: `${(position - 20) * 10}%` };
    } else {
      return { right: '0', top: `${(position - 30) * 10}%` };
    }
  };

  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'finance': return <DollarSign className="w-4 h-4" />;
      case 'marketing': return <Target className="w-4 h-4" />;
      case 'strategy': return <Trophy className="w-4 h-4" />;
      case 'operations': return <BookOpen className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Business Monopoly
          </h1>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <div className="flex space-x-2">
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${
                      difficulty === diff 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`p-2 rounded-lg text-sm font-medium capitalize flex items-center justify-center space-x-1 ${
                      category === cat 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getCategoryIcon(cat)}
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={createRoom}
              disabled={!playerName.trim()}
              className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Create Game Room
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>
            
            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            
            <button
              onClick={joinRoom}
              disabled={!playerName.trim() || !roomCode.trim()}
              className="w-full bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Join Game Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-4">Game Lobby</h2>
          <p className="text-center text-gray-600 mb-6">
            Room Code: <span className="font-mono text-xl font-bold">{roomCode}</span>
          </p>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Players ({players.length}/6)
            </h3>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <div className={`w-4 h-4 rounded-full bg-${['red', 'blue', 'green', 'yellow', 'purple', 'pink'][index]}-500`}></div>
                  <span className="font-medium">{player.name}</span>
                  {player.isHost && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">HOST</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 text-sm text-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span>Difficulty:</span>
              <span className={`font-medium capitalize ${getDifficultyColor(difficulty)}`}>
                {difficulty}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Category:</span>
              <span className="font-medium capitalize flex items-center space-x-1">
                {getCategoryIcon(category)}
                <span>{category}</span>
              </span>
            </div>
          </div>
          
          {players.find(p => p.name === playerName)?.isHost && (
            <button
              onClick={startGame}
              disabled={players.length < 2}
              className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Start Game {players.length < 2 && '(Need 2+ players)'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'playing' && gameData) {
    const currentPlayerData = gameData.players[currentPlayer];
    const isMyTurn = currentPlayerData?.name === playerName;

    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Business Monopoly</h1>
              <span className="text-sm text-gray-600">Room: {roomCode}</span>
              <div className="flex items-center space-x-2 text-sm">
                <span className={getDifficultyColor(difficulty)}>{difficulty}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Trophy className="w-4 h-4" />
              <span>Stats</span>
            </button>
          </div>

          {/* Stats Panel */}
          {showStats && (
            <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
              <h3 className="text-lg font-bold mb-4">Player Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gameData.players.map((player, index) => {
                  const stats = playerStats[player.name] || { 
                    questionsAnswered: 0, 
                    correctAnswers: 0, 
                    accuracy: 0,
                    totalEarnings: 0,
                    averageTime: 0
                  };
                  return (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-3 h-3 rounded-full bg-${['red', 'blue', 'green', 'yellow', 'purple', 'pink'][index]}-500`}></div>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>Questions: {stats.questionsAnswered}</div>
                        <div>Correct: {stats.correctAnswers}</div>
                        <div>Accuracy: {stats.accuracy}%</div>
                        <div>Avg Time: {stats.averageTime}s</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Game Board */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="relative w-full aspect-square max-w-2xl mx-auto bg-green-100 border-4 border-green-800">
                  {/* Board spaces */}
                  {boardSpaces.map((space, index) => {
                    const position = getPlayerPosition(index);
                    return (
                      <div
                        key={index}
                        className="absolute w-16 h-16 bg-white border border-gray-400 flex items-center justify-center text-xs font-bold text-center"
                        style={position}
                      >
                        {space}
                      </div>
                    );
                  })}
                  
                  {/* Players */}
                  {gameData.players.map((player, playerIndex) => {
                    const position = getPlayerPosition(player.position);
                    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink'];
                    return (
                      <div
                        key={playerIndex}
                        className={`absolute w-4 h-4 rounded-full bg-${colors[playerIndex]}-500 border-2 border-white transform -translate-x-1/2 -translate-y-1/2`}
                        style={{
                          ...position,
                          left: position.left ? `calc(${position.left} + ${(playerIndex % 3) * 6}px)` : undefined,
                          right: position.right ? `calc(${position.right} + ${(playerIndex % 3) * 6}px)` : undefined,
                          top: position.top ? `calc(${position.top} + ${Math.floor(playerIndex / 3) * 6}px)` : undefined,
                          bottom: position.bottom ? `calc(${position.bottom} + ${Math.floor(playerIndex / 3) * 6}px)` : undefined,
                        }}
                      />
                    );
                  })}
                  
                  {/* Center Logo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-full w-32 h-32 flex items-center justify-center shadow-lg border-4 border-gray-300">
                      <div className="text-center">
                        <div className="text-xl font-bold">BUSINESS</div>
                        <div className="text-lg font-bold">MONOPOLY</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="w-full lg:w-96 space-y-4">
              {/* Current Turn */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-bold mb-3">Current Turn</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-6 h-6 rounded-full bg-${['red', 'blue', 'green', 'yellow', 'purple', 'pink'][currentPlayer]}-500`}></div>
                  <span className="font-semibold">{currentPlayerData?.name}</span>
                  {isMyTurn && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Your Turn</span>}
                </div>
                
                {isMyTurn && !question && (
                  <button
                    onClick={rollDice}
                    className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                  >
                    Roll Dice
                  </button>
                )}
              </div>

              {/* Question */}
              {question && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Business Question</h3>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span className={timeLeft <= 10 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                        {timeLeft}s
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2 text-sm text-gray-600 flex items-center space-x-2">
                    <span className={getDifficultyColor(question.difficulty)}>{question.difficulty}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      {getCategoryIcon(question.category)}
                      <span>{question.category}</span>
                    </span>
                  </div>
                  
                  <p className="mb-4 font-medium">{question.question}</p>
                  
                  <div className="space-y-2 mb-4">
                    {question.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAnswer(index)}
                        disabled={showResults || timeLeft === 0}
                        className={`w-full p-3 text-left rounded border transition-colors ${
                          selectedAnswer === index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        } ${showResults || timeLeft === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </button>
                    ))}
                  </div>
                  
                  {showResults && lastAnswer && (
                    <div className={`p-3 rounded-lg mb-4 ${
                      lastAnswer.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`font-bold ${lastAnswer.correct ? 'text-green-800' : 'text-red-800'}`}>
                          {lastAnswer.correct ? '✓ Correct!' : '✗ Incorrect'}
                        </span>
                        {lastAnswer.correct && (
                          <span className="text-green-600 font-medium">+£100</span>
                        )}
                      </div>
                      {lastAnswer.explanation && (
                        <p className="text-sm text-gray-700">{lastAnswer.explanation}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        Correct answer: {String.fromCharCode(65 + question.correctAnswer)} - {question.options[question.correctAnswer]}
                      </p>
                    </div>
                  )}
                  
                  {isMyTurn && selectedAnswer !== null && !showResults && timeLeft > 0 && (
                    <button
                      onClick={answerQuestion}
                      className="w-full bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                    >
                      Submit Answer
                    </button>
                  )}
                </div>
              )}

              {/* Players List */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-bold mb-3 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Players
                </h3>
                <div className="space-y-2">
                  {gameData.players.map((player, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full bg-${['red', 'blue', 'green', 'yellow', 'purple', 'pink'][index]}-500`}></div>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">£{player.money}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default App;