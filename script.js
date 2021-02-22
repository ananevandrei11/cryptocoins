//SETTINGS FOR GRAPHIC
const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  width: 400,
  height: 300,
  layout: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    textColor: 'rgba(255, 255, 255, 0.7)',
  },
  grid: {
    vertLines: {
      color: 'rgba(255, 255, 255, 0.2)',
    },
    horzLines: {
      color: 'rgba(255, 255, 255, 0.2)',
    },
  },
  crosshair: {
    mode: LightweightCharts.CrosshairMode.Normal,
  },
  timeScale: {
    timeVisible: true,
  },
})

const candlestickSeries = chart.addCandlestickSeries({
  upColor: '#11FF11',
  borderUpColor: '#11FF11',
  wickUpColor: '#11FF11',
  downColor: '#FF1111',
  borderDownColor: '#FF1111',
  wickDownColor: '#FF1111',
});

//SETTINGS FOR DATA
const FUT_API = 'https://fapi.binance.com';
const FUT_STREAM = 'wss://fstream.binance.com/ws/';
let addStreamCandles = null;
let addStremTrades = null;
const coins = document.getElementById('coins');
const intervals = document.getElementById('intervals');
const tradesListElement = document.getElementById('tradeList');

function changeCoinAndInterval(elem) {
  elem.addEventListener('change', () => {
    addStreamCandles.close();
    addStremTrades.close();
    tradesListElement.innerHTML = '';
    let newPair = coins.value;
    let newInterval = intervals.value;
    setHistoryCoins(newPair, newInterval);
    setStreamCoins(newPair, newInterval);
    setStreamTrade(newPair);
  });
}
changeCoinAndInterval(coins);
changeCoinAndInterval(intervals);
setHistoryCoins(coins.value, intervals.value);
setStreamCoins(coins.value, intervals.value);
setStreamTrade(coins.value);

function setHistoryCoins(pair, interval) {
  fetch(`${FUT_API}/fapi/v1/klines?symbol=${pair.toUpperCase()}&interval=${interval}&limit=500`)
    .then(response => response.json())
    .then(candlesArr => candlestickSeries.setData(
      candlesArr.map(([time, open, high, low, close]) =>
        ({
          time: time / 1000,
          open,
          high,
          low,
          close
        }))
    ))
}

function setStreamCoins(pair, interval) {
  addStreamCandles = new WebSocket(`${FUT_STREAM}${pair}@kline_${interval}`);
  addStreamCandles.onmessage = event => {
    const {
      t: time,
      o: open,
      h: high,
      l: low,
      c: close
    } = JSON.parse(event.data).k;
    candlestickSeries.update({
      time: time / 1000,
      open,
      high,
      low,
      close
    });
  }
}

function setStreamTrade(pair) {
  addStremTrades = new WebSocket(`${FUT_STREAM}${pair}@aggTrade`);
  addStremTrades.onmessage = event => {
    const {
      p: price,
      q: quantity,
      m: isBuyerMaker
    } = JSON.parse(event.data);
    const tradeELem = document.createElement('div');
    tradeELem.classList.add(isBuyerMaker ? 'sell' : 'buy');
    tradeELem.innerHTML = `
      <span>${price}</span>
      <span>${quantity}</span>
      <span>${(price * quantity).toFixed(2)}</span>
    `;
    tradesListElement.prepend(tradeELem);
    if (tradesListElement.children.length > 10) {
      tradesListElement.children[tradesListElement.children.length - 1].remove();
    }
  }
}