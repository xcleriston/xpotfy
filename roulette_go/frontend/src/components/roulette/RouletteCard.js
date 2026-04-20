import React from 'react';

const RouletteCard = ({ name, stats }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center w-full max-w-xs">
      <h3 className="text-lg font-bold mb-2 text-center">{name}</h3>
      <div className="w-full">
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="font-medium">2 Pares seguidos</td>
              <td className="text-right">{stats.pair}</td>
            </tr>
            <tr>
              <td className="font-medium">2 Ímpares seguidos</td>
              <td className="text-right">{stats.odd}</td>
            </tr>
            <tr>
              <td className="font-medium">2 Pretos seguidos</td>
              <td className="text-right">{stats.black}</td>
            </tr>
            <tr>
              <td className="font-medium">2 Vermelhos seguidos</td>
              <td className="text-right">{stats.red}</td>
            </tr>
            <tr>
              <td className="font-medium">2 Baixos seguidos (1-18)</td>
              <td className="text-right">{stats.low}</td>
            </tr>
            <tr>
              <td className="font-medium">2 Altos seguidos (19-36)</td>
              <td className="text-right">{stats.high}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RouletteCard;
