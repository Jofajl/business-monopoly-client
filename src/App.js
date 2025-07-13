import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Users, DollarSign, Clock, Trophy, Target, BookOpen, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Home, Building } from 'lucide-react';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('menu');
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

  const [showStats, setShowStats] = useState(false);
  const [playerStats, setPlayerStats] = useState({});
  const [diceValues, setDiceValues] = useState([1, 1]);
  const [showDice, setShowDice] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [gamePhase, setGamePhase] = useState('question'); // 'question', 'dice', 'property', 'endTurn'


  
  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

  // Enhanced Monopoly board with real properties
  const boardSpaces = [
    { name: 'GO', type: 'corner', color: '', price: 0, rent: [0], position: 'bottom-right' },
    { name: 'Old Kent Road', type: 'property', color: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], group: 'brown' },
    { name: 'Community Chest', type: 'chest', color: '', price: 0, rent: [0] },
    { name: 'Whitechapel Road', type: 'property', color: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], group: 'brown' },
    { name: 'Income Tax', type: 'tax', color: '', price: 0, rent: [200] },
    { name: "King's Cross Station", type: 'station', color: 'black', price: 200, rent: [25, 50, 100, 200] },
    { name: 'The Angel Islington', type: 'property', color: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'lightblue' },
    { name: 'Chance', type: 'chance', color: '', price: 0, rent: [0] },
    { name: 'Euston Road', type: 'property', color: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'lightblue' },
    { name: 'Pentonville Road', type: 'property', color: 'lightblue', price: 120, rent: [8, 40, 100, 300, 450, 600], group: 'lightblue' },
    { name: 'Jail', type: 'corner', color: '', price: 0, rent: [0], position: 'bottom-left' },
    { name: 'Pall Mall', type: 'property', color: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'pink' },
    { name: 'Electric Company', type: 'utility', color: 'yellow', price: 150, rent: [0] },
    { name: 'Whitehall', type: 'property', color: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'pink' },
    { name: 'Northumberland Avenue', type: 'property', color: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], group: 'pink' },
    { name: 'Marylebone Station', type: 'station', color: 'black', price: 200, rent: [25, 50, 100, 200] },
    { name: 'Bow Street', type: 'property', color: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'orange' },
    { name: 'Community Chest', type: 'chest', color: '', price: 0, rent: [0] },
    { name: 'Marlborough Street', type: 'property', color: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'orange' },
    { name: 'Vine Street', type: 'property', color: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], group: 'orange' },
    { name: 'Free Parking', type: 'corner', color: '', price: 0, rent: [0], position: 'top-left' },
    { name: 'The Strand', type: 'property', color: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'red' },
    { name: 'Chance', type: 'chance', color: '', price: 0, rent: [0] },
    { name: 'Fleet Street', type: 'property', color: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'red' },
    { name: 'Trafalgar Square', type: 'property', color: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], group: 'red' },
    { name: 'Fenchurch St Station', type: 'station', color: 'black', price: 200, rent: [25, 50, 100, 200] },
    { name: 'Leicester Square', type: 'property', color: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'yellow' },
    { name: 'Coventry Street', type: 'property', color: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'yellow' },
    { name: 'Water Works', type: 'utility', color: 'yellow', price: 150, rent: [0] },
    { name: 'Piccadilly', type: 'property', color: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], group: 'yellow' },
    { name: 'Go To Jail', type: 'corner', color: '', price: 0, rent: [0], position: 'top-right' },
    { name: 'Regent Street', type: 'property', color: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'green' },
    { name: 'Oxford Street', type: 'property', color: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'green' },
    { name: 'Community Chest', type: 'chest', color: '', price: 0, rent: [0] },
    { name: 'Bond Street', type: 'property', color: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], group: 'green' },
    { name: 'Liverpool St Station', type: 'station', color: 'black', price: 200, rent: [25, 50, 100, 200] },
    { name: 'Chance', type: 'chance', color: '', price: 0, rent: [0] },
    { name: 'Park Lane', type: 'property', color: 'blue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], group: 'blue' },
    { name: 'Super Tax', type: 'tax', color: '', price: 0, rent: [100] },
    { name: 'Mayfair', type: 'property', color: 'blue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], group: 'blue' }
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
      setGamePhase('question');
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
      setGamePhase('question');
    });

    newSocket.on('answerResult', (result) => {
      setLastAnswer(result);
      setShowResults(true);
      setTimeLeft(0);
      if (result.correct) {
        setGamePhase('dice');
      } else {
        setTimeout(() => {
          setGamePhase('question');
          nextPlayerTurn();
        }, 3000);
      }
    });

    newSocket.on('diceRolled', ({ dice, newPosition, canBuyProperty }) => {
      setDiceValues(dice);
      setShowDice(true);
      setTimeout(() => {
        setShowDice(false);
        if (canBuyProperty) {
          setSelectedProperty(boardSpaces[newPosition]);
          setShowPropertyModal(true);
          setGamePhase('property');
        } else {
          setGamePhase('endTurn');
        }
      }, 2000);
    });

    newSocket.on('propertyPurchased', (data) => {
      setGameData(data.gameData);
      setShowPropertyModal(false);
      setGamePhase('endTurn');
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
      socket.emit('createRoom', { playerName: playerName.trim() });
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

  const startTurn = () => {
    socket.emit('startTurn', roomCode);
  };

  const answerQuestion = () => {
    if (selectedAnswer !== null) {
      socket.emit('answerQuestion', { 
        roomCode, 
        answerIndex: selectedAnswer 
      });
    }
  };

  const rollDice = () => {
    socket.emit('rollDice', roomCode);
  };

  const buyProperty = () => {
    socket.emit('buyProperty', { roomCode, propertyIndex: selectedProperty.index });
  };

  const skipProperty = () => {
    setShowPropertyModal(false);
    setGamePhase('endTurn');
  };

  const endTurn = () => {
    socket.emit('endTurn', roomCode);
    setGamePhase('question');
  };

  const nextPlayerTurn = () => {
    setTimeout(() => {
      socket.emit('nextPlayer', roomCode);
    }, 1000);
  };

  const getPropertyColor = (color) => {
    const colors = {
      brown: 'bg-amber-800',
      lightblue: 'bg-sky-300',
      pink: 'bg-pink-400',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-400',
      green: 'bg-green-500',
      blue: 'bg-blue-600',
      black: 'bg-gray-800'
    };
    return colors[color] || 'bg-gray-200';
  };

  const getPlayerPosition = (position) => {
    // Corner positions
    if (position === 0) return { bottom: '0', right: '0', width: '80px', height: '80px' };
    if (position === 10) return { bottom: '0', left: '0', width: '80px', height: '80px' };
    if (position === 20) return { top: '0', left: '0', width: '80px', height: '80px' };
    if (position === 30) return { top: '0', right: '0', width: '80px', height: '80px' };

    // Side positions
    if (position < 10) {
      return { bottom: '0', right: `${80 + (10 - position - 1) * 60}px`, width: '60px', height: '80px' };
    } else if (position < 20) {
      return { left: '0', bottom: `${80 + (position - 10 - 1) * 60}px`, width: '80px', height: '60px' };
    } else if (position < 30) {
      return { top: '0', left: `${80 + (position - 20 - 1) * 60}px`, width: '60px', height: '80px' };
    } else {
      return { right: '0', top: `${80 + (40 - position - 1) * 60}px`, width: '80px', height: '60px' };
    }
  };

  const getBuildingDisplay = (property, houses, hotel) => {
    if (hotel) return <Building className="w-3 h-3 text-red-600" />;
    return Array.from({ length: houses }, (_, i) => (
      <Home key={i} className="w-2 h-2 text-green-600" />
    ));
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
    const myPlayer = gameData.players.find(p => p.name === playerName);

    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Business Monopoly</h1>
              <span className="text-sm text-gray-600">Room: {roomCode}</span>
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Trophy className="w-4 h-4" />
              <span>Stats</span>
            </button>
          </div>

          <div className="flex flex-col xl:flex-row gap-4">
            {/* Game Board */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="relative w-full aspect-square max-w-4xl mx-auto bg-green-200 border-4 border-green-800">
                  {/* Board spaces */}
                  {boardSpaces.map((space, index) => {
                    const position = getPlayerPosition(index);
                    const property = gameData.properties?.find(p => p.index === index);
                    const isOwned = property?.owner;
                    
                    return (
                      <div
                        key={index}
                        className={`absolute border border-gray-400 flex flex-col items-center justify-center text-xs font-bold text-center p-1 ${
                          space.type === 'corner' ? 'bg-yellow-100' : 'bg-white'
                        }`}
                        style={position}
                      >
                        {/* Property color bar */}
                        {space.color && (
                          <div className={`w-full h-2 ${getPropertyColor(space.color)} mb-1`}></div>
                        )}
                        
                        {/* Property name */}
                        <div className="text-xs leading-tight">{space.name}</div>
                        
                        {/* Price */}
                        {space.price > 0 && (
                          <div className="text-xs text-gray-600">£{space.price}</div>
                        )}
                        
                        {/* Houses/Hotels */}
                        {property?.houses > 0 && (
                          <div className="flex space-x-0.5 mt-1">
                            {getBuildingDisplay(space, property.houses, property.hotel)}
                          </div>
                        )}
                        
                        {/* Owner indicator */}
                        {isOwned && (
                          <div className={`w-2 h-2 rounded-full mt-1 bg-${['red', 'blue', 'green', 'yellow', 'purple', 'pink'][gameData.players.findIndex(p => p.name === property.owner)]}-500`}></div>
                        )}
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
                        className={`absolute w-6 h-6 rounded-full bg-${colors[playerIndex]}-500 border-2 border-white transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white text-xs font-bold`}
                        style={{
                          left: position.left ? `calc(${position.left} + ${(playerIndex % 3) * 8}px + 40px)` : undefined,
                          right: position.right ? `calc(${position.right} + ${(playerIndex % 3) * 8}px + 40px)` : undefined,
                          top: position.top ? `calc(${position.top} + ${Math.floor(playerIndex / 3) * 8}px + 40px)` : undefined,
                          bottom: position.bottom ? `calc(${position.bottom} + ${Math.floor(playerIndex / 3) * 8}px + 40px)` : undefined,
                        }}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    );
                  })}
                  
                  {/* Center Logo and Dice */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-full w-48 h-48 flex flex-col items-center justify-center shadow-lg border-4 border-gray-300">
                      <div className="text-center mb-4">
                        <div className="text-xl font-bold">BUSINESS</div>
                        <div className="text-lg font-bold">MONOPOLY</div>
                      </div>
                      
                      {/* Dice Display */}
                      {showDice && (
                        <div className="flex space-x-2 mb-4">
                          {diceValues.map((value, index) => {
                            const DiceIcon = diceIcons[value - 1];
                            return <DiceIcon key={index} className="w-8 h-8 text-red-600" />;
                          })}
                        </div>
                      )}
                      
                      {/* Current Player */}
                      <div className="text-sm text-center">
                        <div className="font-semibold">{currentPlayerData?.name}'s Turn</div>
                        {isMyTurn && (
                          <div className="text-green-600 font-bold">YOUR TURN</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="w-full xl:w-96 space-y-4">
              {/* My Properties */}
              {myPlayer && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="text-lg font-bold mb-3 flex items-center">
                    <Home className="w-5 h-5 mr-2" />
                    My Properties
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {myPlayer.properties && myPlayer.properties.length > 0 ? (
                      myPlayer.properties.map((propIndex, index) => {
                        const space = boardSpaces[propIndex];
                        return (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              {space.color && (
                                <div className={`w-3 h-3 ${getPropertyColor(space.color)}`}></div>
                              )}
                              <span className="text-sm font-medium">{space.name}</span>
                            </div>
                            <span className="text-xs text-gray-600">£{space.price}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500">No properties owned</p>
                    )}
                  </div>
                </div>
              )}

              {/* Turn Actions */}
              {isMyTurn && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="text-lg font-bold mb-3">Your Turn</h3>
                  
                  {gamePhase === 'question' && !question && (
                    <button
                      onClick={startTurn}
                      className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                    >
                      Start Turn - Answer Question
                    </button>
                  )}
                  
                  {gamePhase === 'dice' && (
                    <button
                      onClick={rollDice}
                      className="w-full bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Dice1 className="w-5 h-5" />
                      <span>Roll Dice</span>
                    </button>
                  )}
                  
                  {gamePhase === 'endTurn' && (
                    <button
                      onClick={endTurn}
                      className="w-full bg-gray-500 text-white p-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                    >
                      End Turn
                    </button>
                  )}
                </div>
              )}

              {/* Question */}
              {question && gamePhase === 'question' && (
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
                          {lastAnswer.correct ? '✓ Correct! You can roll dice!' : '✗ Incorrect - Turn skipped'}
                        </span>
                      </div>
                      {lastAnswer.explanation && (
                        <p className="text-sm text-gray-700">{lastAnswer.explanation}</p>
                      )}
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
                      <div className="text-sm">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold">£{player.money}</span>
                        </div>
                        {player.properties && (
                          <div className="text-xs text-gray-600">
                            {player.properties.length} properties
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Purchase Modal */}
        {showPropertyModal && selectedProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Purchase Property</h3>
              <div className="mb-4">
                {selectedProperty.color && (
                  <div className={`w-full h-4 ${getPropertyColor(selectedProperty.color)} mb-2`}></div>
                )}
                <h4 className="text-lg font-semibold">{selectedProperty.name}</h4>
                <p className="text-2xl font-bold text-green-600">£{selectedProperty.price}</p>
                <div className="mt-2 text-sm text-gray-600">
                  <p>Rent: £{selectedProperty.rent[0]}</p>
                  <p>With full color group: £{selectedProperty.rent[1]}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={buyProperty}
                  disabled={myPlayer?.money < selectedProperty.price}
                  className="flex-1 bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Buy Property
                </button>
                <button
                  onClick={skipProperty}
                  className="flex-1 bg-gray-500 text-white p-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default App;
