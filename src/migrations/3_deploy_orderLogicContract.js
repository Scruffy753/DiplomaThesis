const OrderLogicContract = artifacts.require("OrderLogicContract");

module.exports = function(deployer) {
    deployer.deploy(OrderLogicContract);
};