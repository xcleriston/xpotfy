import React from 'react';
import { useBetfair } from '../contexts/BetfairContext';

const BetfairDashboard: React.FC = () => {
  const { 
    accountDetails, 
    accountFunds, 
    events, 
    markets, 
    marketBooks, 
    loading, 
    error, 
    logout, 
    refreshData 
  } = useBetfair();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Account Info */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Account Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your Betfair account details and balance.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {accountDetails ? `${accountDetails.firstName} ${accountDetails.lastName}` : 'N/A'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Available Balance</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {accountFunds ? formatCurrency(accountFunds.availableToBetBalance) : 'N/A'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Exposure</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {accountFunds ? formatCurrency(accountFunds.exposure) : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Events and Markets */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Horse Racing Markets
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Available horse racing events and markets.
            </p>
          </div>
          <button
            onClick={refreshData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Refresh
          </button>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          {events.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No horse racing events found.</p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {events.map((event, index) => {
                const eventMarkets = Object.values(markets).filter(
                  (market) => market.event.id === event.event.id
                );
                
                if (eventMarkets.length === 0) return null;
                
                return (
                  <div key={`${event.event.id}-${index}`} className="mb-8">
                    <h4 className="text-md font-medium text-gray-900 mb-2 px-4">
                      {event.event.name} - {new Date(event.event.openDate).toLocaleString()}
                      <span className="ml-2 text-sm text-gray-500">
                        {event.event.venue}
                      </span>
                    </h4>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Market
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Runners
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Matched
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {eventMarkets.map((market) => {
                            const marketBook = marketBooks[market.marketId];
                            const totalMatched = marketBook?.totalMatched || 0;
                            
                            return (
                              <tr key={market.marketId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {market.marketName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {market.description.marketType}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {market.runners.length} runners
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    marketBook?.status === 'OPEN' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {marketBook?.status || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(totalMatched)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Logout Button */}
      <div className="flex justify-end">
        <button
          onClick={logout}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default BetfairDashboard;
