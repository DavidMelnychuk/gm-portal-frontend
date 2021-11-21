import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/GMPortal.json';

export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");
	const [transactionMining, setTransactionMining] = useState(false);
	const [allGMs, setAllGMs] = useState([]);
	const [message, setMessage] = useState("");

	const contractAddress = "0x72ECed7EB3a9ccfAAeB436431d6D513053E3e698";
	const contractABI = abi.abi;
  
	const checkIfWalletIsConnected = async () => {
		try{
			const { ethereum } = window;
			if (!ethereum) {
				console.log("Make sure you have metamask!");
				return;
			} else {
				console.log("We have the ethereum object", ethereum);
			}

			const accounts = await ethereum.request({method: 'eth_accounts'});

			if(accounts.length !== 0){
				const account = accounts[0];
				console.log("Found an authorized account:", account);
				setCurrentAccount(account);
				getAllGMs();
			} else {
				console.log("No authorized account found");
			}

		} catch (error) {
			console.log(error);
		}
  }

	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if(!ethereum){
				alert("Get MetaMask!");
				return;
			}

			const accounts = await ethereum.request({method: "eth_requestAccounts"});
			console.log("Connected", accounts[0]);

			setCurrentAccount(accounts[0]);
		} catch (error){
			console.log(error);
		}
	}

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const gm = async () => {
		try{
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const gmPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

				let count = await gmPortalContract.getTotalGMs();
				console.log("Retrieved total gm count...", count.toNumber());

				const gmTxn = await gmPortalContract.gm(message, { gasLimit: 900000 });
				setTransactionMining(true);
				console.log("Mining....", gmTxn.hash);
        
				await gmTxn.wait();
				console.log("Mined ---", gmTxn.hash);
				setTransactionMining(false);


				count = await gmPortalContract.getTotalGMs();
				console.log("Retrieved total gm count...", count.toNumber());
			} else {
				console.log("Ethereum object doesn't exist!");
			}

		} catch (error) {
			console.log(error);
		}
  }

	const getAllGMs = async () => {
		try {
			const { ethereum } = window;
			if(ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const gmPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

				const gms = await gmPortalContract.getAllGMs();
        
        console.log(gms);
				const gmsCleaned = gms.map(gm => {
					return {
						address: truncateAddress(gm.user),
						timestamp: new Date(gm.timestamp * 1000),
						message: gm.message
					};
				})

				setAllGMs(gmsCleaned);
			} else {
				console.log("Ethereum object doesn't exist!");
			}

		} catch (error){
			console.log(error);
		}
	}

	useEffect(() => {
		let gmPortalContract;

		const onNewGm = (from, timestamp, message) => {
			console.log('NewGm', from, timestamp, message);
			setAllGMs(prevState => [
				...prevState,
				{
					address: truncateAddress(from),
					timestamp: new Date(timestamp * 1000).toUTCString(),
					message: message,
				},
			]);
		};

		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			gmPortalContract = new ethers.Contract(contractAddress, contractABI, signer);
			gmPortalContract.on('NewGM', onNewGm);
		}

		return () => {
			if (gmPortalContract) {
				gmPortalContract.off('NewGM', onNewGm);
			}
		};
}, []);

	const truncateAddress = (s) => {
		return `${s.substring(0, 6)}...${s.substring(38, s.length)}`
	}
  
	// TODO: Progress bar / Spinner while mining;
	// TODO: Fix table CSS 
  return (
    <div className="mainContainer">
		<div className="video-background">
				<div className="video-foreground">
					<iframe src="https://www.youtube.com/embed/6CHs4x2uqcQ?controls=0&showinfo=0&rel=0&autoplay=1&playlist=6CHs4x2uqcQ&loop=1&start=12&end=170&iv_load_policy=3" frameBorder="0" allowFullScreen></iframe>
				</div>
		</div>

      <div className="dataContainer">
				<h1 className="header">GM ☕ ☀️</h1>
        <div className="bio">
					<h2> My name is <a href="https://twitter.com/david_melnychuk" target="_blank">Dave</a> and I'm learning about web3. </h2>
					<h2> Connect your Ethereum wallet and say gm! :)</h2>
        </div>

					<textarea maxLength="140" rows="3" value={message} placeholder="Your message 😎" onInput={e => setMessage(e.target.value)}/>
					<span>{message.length} / 140</span>

				{!currentAccount ? 
					(
						<button className="gmButton" onClick={connectWallet}>
							Connect Wallet
						</button>
					) 
					: (  
							<button className="gmButton" onClick={gm}>
								gm ☕
							</button>
						) 
				}

				<h2> {allGMs.length} GMs on the blockchain 👇</h2>
				<table className="gmTable">
					<thead>
						<tr>
							<th > Sender</th>
							<th > Message</th>
							<th > Received</th>
						</tr>
					</thead>
					<tbody>
						{allGMs.map((gm, index) => {
						return (
							<tr key={index} className="gmTable__Tr">
								<td className="gmTable__sender">{gm.address}</td>
								<td>{gm.message}</td>
								<td>{gm.timestamp.toString()}</td>
							</tr>
							)
						})}
					</tbody>
				</table>

      </div>
    </div>
  );
}