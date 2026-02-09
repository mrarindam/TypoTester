import { ethers } from "ethers";

export const BASE_CHAIN_ID = 8453;

export async function connectWalletAndSwitchBase() {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return null;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  // Request wallet
  const accounts = await provider.send("eth_requestAccounts", []);
  const network = await provider.getNetwork();

  // Auto switch to Base
  if (Number(network.chainId) !== BASE_CHAIN_ID) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x2105" }], 
    });
  }

  return accounts[0];
}

export async function payEntryFee(walletAddress) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const tx = await signer.sendTransaction({
    to: walletAddress, // self tx
    value: ethers.parseEther("0.00001"),
  });

  await tx.wait();
}
