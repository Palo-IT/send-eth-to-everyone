/**
 * Require the credentials in the .env file
 */
require('dotenv').config()
xlsxj = require("xlsx-to-json");
const Web3 = require('web3')
const axios = require('axios')
const EthereumTx = require('ethereumjs-tx')
const log = require('ololog').configure({ time: true })
const ansi = require('ansicolor').nice


 /**
 * Set network configuration
 */
const testnet = `https://rinkeby.infura.io/${process.env.INFURA_ACCESS_TOKEN}`
const web3 = new Web3( new Web3.providers.HttpProvider(testnet))

 /**
 * Load credentials
 */
web3.eth.defaultAccount = process.env.WALLET_ADDRESS


/**
 * The amount of ETH you want to send in this transaction
 * @type {Number}
 */
const amountToSend = 0.01



 
/**
 * Fetch the current transaction gas prices from https://ethgasstation.info/
 * 
 * @return {object} Gas prices at different priorities
 */
const getCurrentGasPrices = async () => {
  let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json')
  let prices = {
    low: response.data.safeLow / 10,
    medium: response.data.average / 10,
    high: response.data.fast / 10
  }
  console.log("\r\n")
  log (`Current ETH Gas Prices (in GWEI):`.cyan)
  console.log("\r\n")
  log(`Low: ${prices.low} (transaction completes in < 30 minutes)`.green)
  log(`Standard: ${prices.medium} (transaction completes in < 5 minutes)`.yellow)
  log(`Fast: ${prices.high} (transaction completes in < 2 minutes)`.red)
  console.log("\r\n")
  return prices
}


const main = async () => {
	let gasPrices = await getCurrentGasPrices();
	var nonce = web3.eth.getTransactionCount(web3.eth.defaultAccount);

	/**
	* Converting .xlsx file to json object
	*/
	xlsxj({
		input: "Liste des participants.xlsx", 
    	output: "addresses.json"
  	}, function(err, result) {
    if(err) {
      console.error(err);
    }else {
      for(var i = 0; i < result.length; i++){
      	  //Setting tx details
		  let details = {
			    "to": result[i]['Adresse ethereum du wallet'],
			    "value": web3.toHex( web3.toWei(amountToSend, 'ether') ),
			    "gas": 21000,
			    "gasPrice": gasPrices.high * 1000000000, // converts the gwei price to wei
			    "nonce": nonce+i,
			    "chainId": 4 
		  }
		  var transaction = new EthereumTx(details);
		  transaction.sign( Buffer.from(process.env.WALLET_PRIVATE_KEY, 'hex') );//Signing tx
		  var serializedTransaction = transaction.serialize();
		  var transactionId = web3.eth.sendRawTransaction('0x' + serializedTransaction.toString('hex'));
		  var url = `https://rinkeby.etherscan.io/tx/${transactionId}`;
		  console.log(url.cyan);
      }
    }
});
}
main()
