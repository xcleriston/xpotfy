import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

function History() {
  const { user } = useAuth();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    const fetchBets = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call to fetch the user's bet history
        // const response = await fetch(`/api/bets/history?page=${page}&limit=${limit}`);
        // const data = await response.json();
        
        // Mock data for demonstration
        const mockBets = Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          amount: (Math.random() * 100).toFixed(2),
          type: ['straight', 'split', 'street', 'corner', 'line', 'column', 'dozen', 'red_black', 'odd_even'][Math.floor(Math.random() * 9)],
          numbers: Math.random() > 0.5 ? [Math.floor(Math.random() * 37)] : 
                   ['red', 'black', 'odd', 'even', '1-18', '19-36', '1st12', '2nd12', '3rd12', '2to1-1', '2to1-2', '2to1-3'][Math.floor(Math.random() * 12)],
          result: Math.random() > 0.5 ? 'win' : 'loss',
          payout: (Math.random() * 500).toFixed(2),
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        }));
        
        // Sort by timestamp descending
        mockBets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Pagination
        const start = (page - 1) * limit;
        const paginatedBets = mockBets.slice(start, start + limit);
        
        setBets(paginatedBets);
        setTotalPages(Math.ceil(mockBets.length / limit));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bet history:', error);
        setLoading(false);
      }
    };
    
    fetchBets();
  }, [page]);

  const formatBetType = (type) => {
    const typeMap = {
      'straight': 'Straight Up',
      'split': 'Split',
      'street': 'Street',
      'corner': 'Corner',
      'line': 'Line',
      'column': 'Column',
      'dozen': 'Dozen',
      'red_black': 'Red/Black',
      'odd_even': 'Odd/Even',
      'low_high': 'Low/High'
    };
    
    return typeMap[type] || type;
  };

  const formatNumbers = (numbers) => {
    if (Array.isArray(numbers)) {
      return numbers.join(', ');
    }
    
    const numberMap = {
      'red': 'Red',
      'black': 'Black',
      'odd': 'Odd',
      'even': 'Even',
      '1-18': '1-18',
      '19-36': '19-36',
      '1st12': '1st 12',
      '2nd12': '2nd 12',
      '3rd12': '3rd 12',
      '2to1-1': '2:1 (1st column)',
      '2to1-2': '2:1 (2nd column)',
      '2to1-3': '2:1 (3rd column)'
    };
    
    return numberMap[numbers] || numbers;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Betting History</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your past bets and results
        </p>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bet
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payout
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bets.map((bet) => (
                <tr key={bet.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatNumbers(bet.numbers)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBetType(bet.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseFloat(bet.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      bet.result === 'win' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {bet.result}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    bet.result === 'win' ? 'text-green-600 font-medium' : 'text-gray-500'
                  }`}>
                    {bet.result === 'win' ? `+$${parseFloat(bet.payout).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(bet.timestamp), 'MMM d, yyyy h:mm a')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * limit, bets.length + (page - 1) * limit)}</span> of{' '}
                <span className="font-medium">{totalPages * limit}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pageNum
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Betting Statistics</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Your overall betting performance</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Bets</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">247</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Win Rate</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '58%' }}></div>
                </div>
                <span className="mt-1 block text-right">58%</span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Wagered</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">$12,450.00</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Winnings</dt>
              <dd className="mt-1 text-sm text-green-600 font-medium sm:mt-0 sm:col-span-2">+$8,715.00</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Net Profit/Loss</dt>
              <dd className="mt-1 text-sm text-red-600 font-medium sm:mt-0 sm:col-span-2">-$3,735.00</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Average Bet</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">$50.40</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Favorite Bet Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">Red/Black (42%)</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default History;
