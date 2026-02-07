// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ResearchToken is ERC20 , Ownable
{
	address public platform;

	constructor() ERC20("ResearchToken" , "RT") Ownable(msg.sender){}

	function setPlatform(address _platform) external onlyOwner {
		platform = _platform;
	}

	function mint(address to , uint256 amount) external 
	{
		require(msg.sender == platform , "Only plarform can mint");
		_mint(to , amount);
	}

	function burn(address from , uint256 amount) external onlyOwner
	{
		_burn(from , amount);
	}
}