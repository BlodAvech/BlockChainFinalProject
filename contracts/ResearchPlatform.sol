// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ResearchToken.sol";

contract ResearchPlatform 
{
    ResearchToken public token;

	uint256 public projectCount;
    uint256 public constant SHARE_RATE = 100;
    uint256 public constant REWARD_RATE = 10;

    struct Project{
        string title;
        address owner;
        uint256 goal;
        uint256 deadline;
        uint256 totalRaised;
        uint256 totalShares;
        uint256 valuation;
        bool finalized;
    }
    
    mapping (uint256 => Project) public projects;
    mapping (uint256 => mapping (address => uint256)) public contributions;
    mapping (uint256 => mapping (address => uint256)) public shares;

    event ProjectCreated(
        uint256 projectID, 
        string title, 
        address owner
        );

    event Contributed(
        uint256 projectID,
        address contributor,
        uint256 amount,
        uint256 sharesIssued
    );
    event ValuationUpdate(uint256 projectID, uint256 newValuation);
    event Finalized(uint256 projectID);

    constructor (address tokenAddress) {
        token = ResearchToken(tokenAddress);
    }

    function createProject(
        string memory title,
        uint256 goal,
        uint256 duration
    ) external {
        require(goal > 0 , "Goal must be > 0");
        require(duration > 0 , "Duration must be > 0");

        projectCount++;

        projects[projectCount] = Project({
            title: title,
            owner: msg.sender,
            goal: goal,
            deadline: block.timestamp + duration,
            totalRaised: 0,
            totalShares: 0,
            valuation: goal,
            finalized: false
        });
        
        emit ProjectCreated(projectCount, title , msg.sender);
    }

    function contribute(uint256 projectID) external payable {
        Project storage project = projects[projectID];

        require(block.timestamp < project.deadline , "Project ended");
        require(msg.value > 0 , "Send ETH");
        require(!project.finalized , "Finalized");

        contributions[projectID][msg.sender] += msg.value;
        project.totalRaised += msg.value;

        uint256 newShares = msg.value * SHARE_RATE;
        shares[projectID][msg.sender] += newShares;
        project.totalShares += newShares;

        uint rewardAmount = msg.value * REWARD_RATE;
        token.mint(msg.sender , rewardAmount);

        emit Contributed(projectID, msg.sender, msg.value, newShares);
    }

    function updateValuation(uint256 projectID, uint256 newValuation) external {
        Project storage project = projects[projectID];

        require(msg.sender == project.owner , "Not Owner");
        require(!project.finalized , "Finalized");
        require(newValuation >= project.totalRaised, "Valuation too low");

        project.valuation = newValuation;

        emit ValuationUpdate(projectID, newValuation);
    }

    function finalizeProject(uint256 projectID) external {
        Project storage project = projects[projectID];

        require(block.timestamp >= project.deadline , "Too early");
        require(!project.finalized , "Already finalized");

        project.finalized = true;

        emit Finalized(projectID);
    }

    function withdraw(uint projectID) external {
        Project storage project = projects[projectID];

        require(project.finalized, "Not finalized");
        require(project.totalRaised >= project.goal , "Goal not reached");
        require(msg.sender == project.owner , "Not Owner");

        uint256 amount = project.totalRaised;
        project.totalRaised = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    function refund(uint256 projectID) external {
        Project storage project = projects[projectID];

        require(project.finalized , "Not finalized");
        require(project.totalRaised < project.goal , "Goal reached");
        
        uint256 contributed = contributions[projectID][msg.sender];
        require(contributed > 0, "Nothing to refund");

        contributions[projectID][msg.sender] = 0;
        shares[projectID][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: contributed}("");
        require(success, "ETH transfer failed");
    }

    function getSharedPrice(uint256 projectID) external view returns (uint256) {
        Project storage project = projects[projectID];

        if (project.totalShares == 0){
            return 0;
        }

        return project.valuation / project.totalShares;
    }
}