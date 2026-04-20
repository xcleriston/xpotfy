import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Roulette wheel numbers with their colors (0 is green, others alternate between red and black)
const WHEEL_NUMBERS = [
  { number: 0, color: 'green' },
  { number: 32, color: 'red' }, { number: 15, color: 'black' },
  { number: 19, color: 'red' }, { number: 4, color: 'black' },
  { number: 21, color: 'red' }, { number: 2, color: 'black' },
  { number: 25, color: 'red' }, { number: 17, color: 'black' },
  { number: 34, color: 'red' }, { number: 6, color: 'black' },
  { number: 27, color: 'red' }, { number: 13, color: 'black' },
  { number: 36, color: 'red' }, { number: 11, color: 'black' },
  { number: 30, color: 'red' }, { number: 8, color: 'black' },
  { number: 23, color: 'red' }, { number: 10, color: 'black' },
  { number: 5, color: 'red' }, { number: 24, color: 'black' },
  { number: 16, color: 'red' }, { number: 33, color: 'black' },
  { number: 1, color: 'red' }, { number: 20, color: 'black' },
  { number: 14, color: 'red' }, { number: 31, color: 'black' },
  { number: 9, color: 'red' }, { number: 22, color: 'black' },
  { number: 18, color: 'red' }, { number: 29, color: 'black' },
  { number: 7, color: 'red' }, { number: 28, color: 'black' },
  { number: 12, color: 'red' }, { number: 35, color: 'black' },
  { number: 3, color: 'red' }, { number: 26, color: 'black' }
];

// Betting options
const BET_TYPES = {
  STRAIGHT_UP: 'straight',
  SPLIT: 'split',
  STREET: 'street',
  CORNER: 'corner',
  FIVE_NUM: 'five',
  LINE: 'line',
  COLUMN: 'column',
  DOZEN: 'dozen',
  LOW_HIGH: 'low_high',
  RED_BLACK: 'red_black',
  ODD_EVEN: 'odd_even'
};

// Payout multipliers for each bet type
const PAYOUTS = {
  [BET_TYPES.STRAIGHT_UP]: 35,
  [BET_TYPES.SPLIT]: 17,
  [BET_TYPES.STREET]: 11,
  [BET_TYPES.CORNER]: 8,
  [BET_TYPES.FIVE_NUM]: 6,
  [BET_TYPES.LINE]: 5,
  [BET_TYPES.COLUMN]: 2,
  [BET_TYPES.DOZEN]: 2,
  [BET_TYPES.LOW_HIGH]: 1,
  [BET_TYPES.RED_BLACK]: 1,
  [BET_TYPES.ODD_EVEN]: 1
};

function Game() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(user?.balance || 0);
  const [betAmount, setBetAmount] = useState(10);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [betType, setBetType] = useState(null);
  const [currentStep, setCurrentStep] = useState('betting'); // 'betting', 'spinning', 'result'
  const [winningNumber, setWinningNumber] = useState(null);
  const [winAmount, setWinAmount] = useState(0);
  const [bets, setBets] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayCount, setAutoPlayCount] = useState(10);
  const [autoPlayWinStop, setAutoPlayWinStop] = useState(100);
  const [autoPlayLossStop, setAutoPlayLossStop] = useState(0);
  
  const wheelRef = useRef(null);
  const autoPlayRef = useRef(null);
  
  // Update balance when user changes
  useEffect(() => {
    if (user?.balance !== undefined) {
      setBalance(user.balance);
    }
  }, [user]);
  
  // Handle number selection
  const handleNumberClick = (number) => {
    if (currentStep !== 'betting') return;
    
    setSelectedNumbers(prev => {
      const isSelected = prev.includes(number);
      if (isSelected) {
        return prev.filter(n => n !== number);
      } else {
        return [...prev, number];
      }
    });
  };
  
  // Place bet
  const placeBet = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Please select at least one number');
      return;
    }
    
    if (betAmount <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }
    
    if (betAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    
    // In a real app, this would be an API call to the backend
    const newBet = {
      id: Date.now(),
      numbers: [...selectedNumbers],
      amount: betAmount,
      type: betType || 'straight',
      payout: PAYOUTS[betType || 'straight'] * betAmount,
      time: new Date().toISOString()
    };
    
    setBets([...bets, newBet]);
    setBalance(prev => prev - betAmount);
    setSelectedNumbers([]);
    
    toast.success(`Bet placed: $${betAmount} on ${newBet.numbers.join(', ')}`);
  };
  
  // Spin the wheel
  const spinWheel = () => {
    if (bets.length === 0) {
      toast.error('Please place at least one bet');
      return;
    }
    
    setCurrentStep('spinning');
    setIsSpinning(true);
    
    // Simulate wheel spin
    const spinDuration = 5000; // 5 seconds
    const startTime = Date.now();
    const spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
      setWinningNumber(WHEEL_NUMBERS[randomIndex]);
    }, 50);
    
    // Stop spinning and show result
    setTimeout(() => {
      clearInterval(spinInterval);
      setIsSpinning(false);
      
      // Select a random winning number
      const randomIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
      const winner = WHEEL_NUMBERS[randomIndex];
      setWinningNumber(winner);
      
      // Calculate winnings
      let totalWin = 0;
      const winningBets = bets.filter(bet => 
        bet.numbers.some(num => 
          num === winner.number || 
          (winner.color === 'red' && num === 'red') ||
          (winner.color === 'black' && num === 'black') ||
          (winner.number % 2 === 0 && num === 'even') ||
          (winner.number % 2 === 1 && num === 'odd') ||
          (winner.number >= 1 && winner.number <= 18 && num === '1-18') ||
          (winner.number >= 19 && winner.number <= 36 && num === '19-36') ||
          (winner.number >= 1 && winner.number <= 12 && num === '1st12') ||
          (winner.number >= 13 && winner.number <= 24 && num === '2nd12') ||
          (winner.number >= 25 && winner.number <= 36 && num === '3rd12') ||
          (winner.number % 3 === 1 && num === '2to1-1') ||
          (winner.number % 3 === 2 && num === '2to1-2') ||
          (winner.number % 3 === 0 && num === '2to1-3')
        )
      );
      
      winningBets.forEach(bet => {
        totalWin += bet.amount * (PAYOUTS[bet.type] + 1);
      });
      
      setWinAmount(totalWin);
      setBalance(prev => prev + totalWin);
      
      if (totalWin > 0) {
        toast.success(`You won $${totalWin.toFixed(2)}!`);
      } else {
        toast.info('Better luck next time!');
      }
      
      setCurrentStep('result');
      
      // Reset for next round
      setTimeout(() => {
        setBets([]);
        setWinAmount(0);
        setCurrentStep('betting');
        
        // Continue autoplay if enabled
        if (autoPlay && autoPlayCount > 0) {
          const newCount = autoPlayCount - 1;
          setAutoPlayCount(newCount);
          
          // Check stop conditions
          if ((autoPlayWinStop > 0 && balance >= autoPlayWinStop) || 
              (autoPlayLossStop > 0 && balance <= autoPlayLossStop) ||
              newCount === 0) {
            setAutoPlay(false);
            toast.info('Autoplay completed');
          } else {
            autoPlayRef.current = setTimeout(spinWheel, 1000);
          }
        }
      }, 3000);
      
    }, spinDuration);
  };
  
  // Toggle autoplay
  const toggleAutoPlay = () => {
    if (autoPlay) {
      // Stop autoplay
      setAutoPlay(false);
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    } else {
      // Start autoplay
      if (autoPlayCount <= 0) {
        toast.error('Please set a valid number of spins');
        return;
      }
      
      setAutoPlay(true);
      autoPlayRef.current = setTimeout(spinWheel, 1000);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, []);
  
  // Render the roulette table
  const renderRouletteTable = () => {
    return (
      <div className="grid grid-cols-13 gap-0.5 bg-green-800 p-2 rounded-lg">
        {/* First row: 0 and 00 */}
        <div 
          className={`col-span-1 h-12 flex items-center justify-center text-white font-bold ${selectedNumbers.includes(0) ? 'bg-yellow-500' : 'bg-green-700'} cursor-pointer`}
          onClick={() => handleNumberClick(0)}
        >
          0
        </div>
        <div className="col-span-12"></div>
        
        {/* Number grid */}
        {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map(col => (
          <div key={col} className="col-span-1 flex flex-col">
            {/* Top row: 3, 6, 9, ..., 36 */}
            <div 
              className={`h-12 flex items-center justify-center text-white font-bold ${
                col % 2 === 0 ? 'bg-red-600' : 'bg-black'
              } ${selectedNumbers.includes(col) ? '!bg-yellow-500' : ''} cursor-pointer`}
              onClick={() => handleNumberClick(col)}
            >
              {col}
            </div>
            
            {/* Middle row: 2, 5, 8, ..., 35 */}
            <div 
              className={`h-12 flex items-center justify-center text-white font-bold ${
                (col - 1) % 2 === 0 ? 'bg-red-600' : 'bg-black'
              } ${selectedNumbers.includes(col - 1) ? '!bg-yellow-500' : ''} cursor-pointer`}
              onClick={() => handleNumberClick(col - 1)}
            >
              {col - 1}
            </div>
            
            {/* Bottom row: 1, 4, 7, ..., 34 */}
            <div 
              className={`h-12 flex items-center justify-center text-white font-bold ${
                (col - 2) % 2 === 0 ? 'bg-red-600' : 'bg-black'
              } ${selectedNumbers.includes(col - 2) ? '!bg-yellow-500' : ''} cursor-pointer`}
              onClick={() => handleNumberClick(col - 2)}
            >
              {col - 2}
            </div>
          </div>
        ))}
        
        {/* Outside bets */}
        <div className="col-span-1 flex flex-col">
          <div 
            className={`h-12 flex items-center justify-center text-white font-bold bg-green-700 ${
              selectedNumbers.includes('1st12') ? 'bg-yellow-500' : ''
            } cursor-pointer`}
            onClick={() => handleNumberClick('1st12')}
          >
            1-12
          </div>
          <div 
            className={`h-12 flex items-center justify-center text-white font-bold bg-green-700 ${
              selectedNumbers.includes('2nd12') ? 'bg-yellow-500' : ''
            } cursor-pointer`}
            onClick={() => handleNumberClick('2nd12')}
          >
            13-24
          </div>
          <div 
            className={`h-12 flex items-center justify-center text-white font-bold bg-green-700 ${
              selectedNumbers.includes('3rd12') ? 'bg-yellow-500' : ''
            } cursor-pointer`}
            onClick={() => handleNumberClick('3rd12')}
          >
            25-36
          </div>
        </div>
        
        <div className="col-span-1 flex flex-col">
          <div 
            className={`h-12 flex items-center justify-center text-white font-bold bg-black ${
              selectedNumbers.includes('1-18') ? 'bg-yellow-500' : ''
            } cursor-pointer`}
            onClick={() => handleNumberClick('1-18')}
          >
            1-18
          </div>
          <div 
            className={`h-12 flex items-center justify-center text-white font-bold bg-black ${
              selectedNumbers.includes('even') ? 'bg-yellow-500' : ''
            } cursor-pointer`}
            onClick={() => handleNumberClick('even')}
          >
            EVEN
          </div>
          <div 
            className={`h-12 flex items-center justify-center text-white font-bold bg-red-600 ${
              selectedNumbers.includes('red') ? 'bg-yellow-500' : ''
            } cursor-pointer`}
            onClick={() => handleNumberClick('red')}
          >
            RED
          </div>
        </div>
        
        <div className="col-span-1 flex flex-col">
          <div 
            className={`h-12 flex items-center justify-center text-white font-bold bg-black ${
              selectedNumbers.includes('odd') ? 'bg-yellow-500' : ''
            } cursor-pointer`}
            onClick={() => handleNumberClick('odd')}
          >
            ODD
          </div>
          <div 
            className={`h-12 flex items-center justify-center text-white font-bold bg-black ${
              selectedNumbers.includes('black') ? 'bg-yellow-500' : ''
            } cursor-pointer`}
            onClick={() => handleNumberClick('black')}
          >
            BLACK
          </div>
          <div 
            className={`h-12 flex items-center justify-center text-white font-bold bg-red-600 ${
              selectedNumbers.includes('19-36') ? 'bg-yellow-500' : ''
            } cursor-pointer`}
            onClick={() => handleNumberClick('19-36')}
          >
            19-36
          </div>
        </div>
        
        {/* 2 to 1 bets */}
        <div className="col-span-1 flex flex-col">
          <div 
            className={`h-12 flex items-center justify-center text-white font-bold bg-green-700 ${
              selectedNumbers.includes('2to1-1') ? 'bg-yellow-500' : ''
            } cursor-pointer`}
            onClick={() => handleNumberClick('2to1-1')}
          >
            2:1
          </div>
          <div 
            className={`h-12 flex items-center justify-center text-white font-bold bg-green-700 ${
              selectedNumbers.includes('2to1-2') ? 'bg-yellow-500' : ''
            } cursor-pointer`}
            onClick={() => handleNumberClick('2to1-2')}
          >
            2:1
          </div>
          <div 
            className={`h-12 flex items-center justify-center text-white font-bold bg-green-700 ${
              selectedNumbers.includes('2to1-3') ? 'bg-yellow-500' : ''
            } cursor-pointer`}
            onClick={() => handleNumberClick('2to1-3')}
          >
            2:1
          </div>
        </div>
      </div>
    );
  };
  
  // Render the wheel
  const renderWheel = () => {
    return (
      <div className="relative w-64 h-64 mx-auto my-8">
        <div 
          ref={wheelRef}
          className={`w-full h-full rounded-full border-8 border-gray-200 bg-gray-900 flex items-center justify-center transition-transform duration-5000 ${isSpinning ? 'animate-spin' : ''}`}
          style={{
            background: 'conic-gradient(' + 
              WHEEL_NUMBERS.map((num, i) => 
                `${num.color === 'red' ? '#DC2626' : num.color === 'black' ? '#000000' : '#10B981'} ${(i / WHEEL_NUMBERS.length * 100)}% ${((i + 1) / WHEEL_NUMBERS.length * 100)}%`
              ).join(', ') + ')'
          }}
        >
          <div className="w-1/2 h-1/2 rounded-full bg-gray-200 flex items-center justify-center">
            {winningNumber && (
              <div className={`text-2xl font-bold ${
                winningNumber.color === 'red' ? 'text-red-600' : 
                winningNumber.color === 'black' ? 'text-black' : 'text-green-600'
              }`}>
                {winningNumber.number}
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-red-600"></div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Roulette</h1>
        <p className="mt-1 text-sm text-gray-500">
          Place your bets and spin the wheel to win big!
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Game info and controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Game Info</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="balance" className="block text-sm font-medium text-gray-700">Balance</label>
                <div className="mt-1 text-2xl font-semibold text-gray-900">${balance.toFixed(2)}</div>
              </div>
              
              <div>
                <label htmlFor="betAmount" className="block text-sm font-medium text-gray-700">Bet Amount</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    name="betAmount"
                    id="betAmount"
                    min="1"
                    step="0.01"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  />
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[1, 5, 10, 50, 100, 500, 1000, '1/2', '2x', 'Max'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        if (value === '1/2') {
                          setBetAmount(prev => Math.max(0.01, Math.floor(prev * 0.5 * 100) / 100));
                        } else if (value === '2x') {
                          setBetAmount(prev => Math.min(balance, Math.ceil(prev * 2 * 100) / 100));
                        } else if (value === 'Max') {
                          setBetAmount(balance);
                        } else {
                          setBetAmount(parseFloat(value));
                        }
                      }}
                      className="inline-flex justify-center py-2 px-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Bet Type</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {Object.entries({
                    'Straight Up': BET_TYPES.STRAIGHT_UP,
                    'Split': BET_TYPES.SPLIT,
                    'Street': BET_TYPES.STREET,
                    'Corner': BET_TYPES.CORNER,
                    'Line': BET_TYPES.LINE,
                    'Column': BET_TYPES.COLUMN,
                    'Dozen': BET_TYPES.DOZEN,
                    'Red/Black': BET_TYPES.RED_BLACK,
                    'Odd/Even': BET_TYPES.ODD_EVEN,
                    'Low/High': BET_TYPES.LOW_HIGH
                  }).map(([label, value]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBetType(value)}
                      className={`py-2 px-3 border rounded-md text-sm font-medium ${
                        betType === value
                          ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-2">
                <button
                  type="button"
                  onClick={placeBet}
                  disabled={currentStep !== 'betting'}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    currentStep !== 'betting' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Place Bet
                </button>
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={spinWheel}
                  disabled={currentStep !== 'betting' || bets.length === 0}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    currentStep !== 'betting' || bets.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Spin Wheel
                </button>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Autoplay</h3>
                    <p className="text-xs text-gray-500">Automate your betting</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAutoPlay}
                    className={`${
                      autoPlay ? 'bg-red-600' : 'bg-gray-200'
                    } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    role="switch"
                    aria-checked={autoPlay}
                  >
                    <span className="sr-only">Use setting</span>
                    <span
                      aria-hidden="true"
                      className={`${
                        autoPlay ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                    />
                  </button>
                </div>
                
                {autoPlay && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label htmlFor="autoPlayCount" className="block text-xs font-medium text-gray-700">Spins</label>
                      <input
                        type="number"
                        id="autoPlayCount"
                        min="1"
                        value={autoPlayCount}
                        onChange={(e) => setAutoPlayCount(parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="autoPlayWinStop" className="block text-xs font-medium text-gray-700">Stop on win</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="autoPlayWinStop"
                          min="0"
                          step="0.01"
                          value={autoPlayWinStop}
                          onChange={(e) => setAutoPlayWinStop(parseFloat(e.target.value) || 0)}
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="autoPlayLossStop" className="block text-xs font-medium text-gray-700">Stop on loss</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="autoPlayLossStop"
                          min="0"
                          step="0.01"
                          value={autoPlayLossStop}
                          onChange={(e) => setAutoPlayLossStop(parseFloat(e.target.value) || 0)}
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Current Bets</h2>
            {bets.length === 0 ? (
              <p className="text-sm text-gray-500">No active bets</p>
            ) : (
              <ul className="space-y-2">
                {bets.map((bet, index) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span className="font-medium">{Array.isArray(bet.numbers) ? bet.numbers.join(', ') : bet.numbers}</span>
                    <span>${bet.amount.toFixed(2)}</span>
                  </li>
                ))}
                <li className="border-t border-gray-200 pt-2 mt-2 font-semibold flex justify-between">
                  <span>Total:</span>
                  <span>${bets.reduce((sum, bet) => sum + bet.amount, 0).toFixed(2)}</span>
                </li>
              </ul>
            )}
          </div>
        </div>
        
        {/* Right column: Roulette table and wheel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Roulette Table</h2>
            {renderRouletteTable()}
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Wheel</h2>
            {renderWheel()}
            
            {winningNumber && currentStep === 'result' && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">The ball landed on:</p>
                <div className={`text-2xl font-bold mt-1 ${
                  winningNumber.color === 'red' ? 'text-red-600' : 
                  winningNumber.color === 'black' ? 'text-black' : 'text-green-600'
                }`}>
                  {winningNumber.number} {winningNumber.color}
                </div>
                {winAmount > 0 ? (
                  <p className="text-green-600 font-medium mt-2">You won ${winAmount.toFixed(2)}!</p>
                ) : (
                  <p className="text-gray-700 mt-2">Better luck next time!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;
