import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/GMPortal.json';
import moment from 'moment';

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

				const gmTxn = await gmPortalContract.gm(message, { gasLimit: 900000 });
				setTransactionMining(true);

				await gmTxn.wait();
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
        const gmsCleaned = gms.map(gm => {
					return {
						address: truncateAddress(gm.user),
						timestamp: new Date(gm.timestamp * 1000),
						message: gm.message
					};
				})
        gmsCleaned.sort((a, b) => b.timestamp - a.timestamp);
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
        {
					address: truncateAddress(from),
					timestamp: new Date(timestamp * 1000).toUTCString(),
					message: message,
				},
				...prevState,
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

				{!currentAccount ? 
					(
						<button className="gmButton" onClick={connectWallet}>
							Connect Wallet
						</button>
					) 
					: (  
            <>
              <textarea maxLength="140" rows="3" value={message} placeholder="Your message 😎" onChange={e => setMessage(e.target.value)}/>
					    <span>{message.length} / 140</span>

              <button className="gmButton" onClick={gm} disabled={transactionMining}>
								
                {transactionMining && (
                  <i
                    className="fa fa-circle-o-notch fa-spin"
                    style={{ marginRight: "5px" }}
                  />
                )}
                {transactionMining && <span>good morning ☀️</span>}
                {!transactionMining && <span>gm ⛅</span>}
							</button>
              <h2> {allGMs.length} GMs on the blockchain 👇</h2>
                  <table className="gmTable">
                    <thead>
                      <tr>
                        <th > Sender</th>
                        <th > Message</th>
                        <th > Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allGMs.map((gm, index) => {
                      return (
                        <tr key={index} className="gmTable__Tr">
                          <td className="gmTable__sender">{gm.address}</td>
                          <td className="gmTable__msg">{gm.message}</td>
                          <td className="gmTable__sent">{moment(gm.timestamp).fromNow()}</td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
            </>
						) 
				}
      </div>
    </div>
  );
}