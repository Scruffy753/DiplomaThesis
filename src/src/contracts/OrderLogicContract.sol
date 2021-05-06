pragma solidity ^0.8.0;

import "./DeliveryContract.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract OrderLogicContract{
    // Authorities
    address public authority;

    // key:value store
    uint  public orderCount = 0;
    mapping(uint => Order) public orders;

    mapping(uint => ConfirmationMechanism) public storeShipnent;
    mapping(uint => ConfirmationMechanism) public customerRecievement;
    mapping(uint => ConfirmationMechanism) public customerShipment;
    mapping(uint => ConfirmationMechanism) public storeRecievement;
    mapping(uint => Settlement) public settlements;

    mapping(address => uint) public adressOrder;

    // STRUCTS

    struct Order {
        // identificator of the order
        uint id;
        // roles
        address payable customer;
        address payable store;
        address deliverer;
        //
        uint costInTotal;
        int256 acceptedDate;

        //
        uint productListHash;
        uint returnedProductListHash;
        uint returnedListHash;
        uint customerInformationHash;


        // State
        OrderState state;
    }

    enum OrderState{
        CREATED,                        // 0
        PAID,                           // 1
        ACCEPTED,                       // 2
        SHIPPED,                        // 3
        CANCELLED,                      // 4
        DELIVERED,                      // 5
        COMPLETED,                      // 6
        SENTBACK,                       // 7
        RETURNED,                       // 8
        PROPOSALFORSETTLEMENT,          // 9
        FROZEN,                         // 10
        REFUNDED                        // 11
    }

    struct ConfirmationMechanism{
        address condignor;
        address recipient;
        uint256  consignorConfimraiton; // timestamp
        uint256  recipientConfimraiton; // timestamp
        bool exists;  // workaround
    }

    struct Settlement{
        uint refundedAmount;
        string reason;
        bool accepted;
        uint decicedRefundAmount;
        bool exists;  // workaround
    }

    constructor() public {
        authority = msg.sender;
    }
    // EVENTS
    event OrderStateChanged(
        uint orderId,
        OrderState state
    );


    // FUNCTIONS
    function createOrder(
        address payable _customer,
        address payable _store,
        address _deliverer,
        string memory _productsList,
        uint _productCount,
        uint _costInTotal
    ) public returns (uint orderId) {

        // add Order
        orderCount++;
        //ConfirmationMechanism storage empty = ConfirmationMechanism(address(0), address(0), 0,0);

        orders[orderCount] = Order( orderCount,
            _customer,
            _store,
            _deliverer,
            _costInTotal,
            0, 0, 0, 0 , 0,
            OrderState.CREATED);
        emit OrderStateChanged( orderCount, OrderState.CREATED );
    }

    function payOrder( uint _orderId) public payable {
        // Make sure the id is valid
        require(_orderId > 0 && _orderId <= orderCount);

        // Fetch the post
        Order memory _order = orders[_orderId];
        require(_order.state == OrderState.CREATED);
        require( _order.costInTotal == msg.value ); // if is enought to pay
        // update state
        _order.state = OrderState.PAID;
        // update order
        orders[_orderId] = _order;
        emit OrderStateChanged( _orderId, _order.state );
    }

    function acceptOrder(uint _orderId) public {
        // Make sure the id is valid
        require(_orderId > 0 && _orderId <= orderCount);
        // Fetch the post
        Order memory _order = orders[_orderId];
        // Check sender role in order
        require(_order.store == msg.sender);
        // Check state of the order
        require(_order.state == OrderState.PAID);
        // update state
        _order.state = OrderState.ACCEPTED;
        // update order
        orders[_orderId] = _order;
        // emit event
        emit OrderStateChanged( _orderId, _order.state );
    }




    function returnProducts( uint _orderId,
        string memory _productsList ) public {
        // Make sure the id is valid
        require(_orderId > 0 && _orderId <= orderCount);
        // Fetch the order
        Order memory _order = orders[_orderId];
        require(_order.state == OrderState.DELIVERED);
        _order.returnedListHash = 1;
        orders[_orderId] = _order;
        emit OrderStateChanged( _orderId, _order.state );
    }

    function makeProposal( uint _orderId, uint _amount, string memory _reason ) public {
        // Make sure the id is valid
        require(_orderId > 0 && _orderId <= orderCount);
        // Fetch the order
        Order memory _order = orders[_orderId];
        require(_order.state == OrderState.RETURNED );
        require(_order.costInTotal >= _amount );
        require( msg.sender == _order.store );

        settlements[ _orderId ] = Settlement( _amount, _reason, false, 0, true );

        _order.state = OrderState.PROPOSALFORSETTLEMENT;
        orders[_orderId] = _order;
        emit OrderStateChanged( _orderId, _order.state );
    }

    function makeRefund( uint _orderId ) public {
        // Make sure the id is valid
        require(_orderId > 0 && _orderId <= orderCount);
        // Fetch the order
        Order memory _order = orders[_orderId];
        require(_order.state == OrderState.RETURNED );
        require( msg.sender == _order.store );

        // Return payment to cutomer account
        //address payable adr= address(_order.customer);
        _order.customer.transfer( _order.costInTotal );

        _order.state = OrderState.REFUNDED;
        orders[_orderId] = _order;
        emit OrderStateChanged( _orderId, _order.state );
    }

    function payBasedProposal( Order memory _order, Settlement memory _settlement ) private {
        if ( ( _order.state == OrderState.PROPOSALFORSETTLEMENT ) &&
            _settlement.accepted){
            _order.customer.transfer( _settlement.refundedAmount );
            _order.store.transfer(_order.costInTotal - _settlement.refundedAmount );
        }else if( ( _order.state == OrderState.FROZEN ) ) {
            _order.customer.transfer( _settlement.decicedRefundAmount );
            _order.store.transfer( _order.costInTotal - _settlement.decicedRefundAmount );
        }
    }

    function proposalAcceptence( uint _orderId, bool _accept ) public {
        // Make sure the id is valid
        require(_orderId > 0 && _orderId <= orderCount);
        // Fetch the order
        Order memory _order = orders[_orderId];
        require(_order.state == OrderState.PROPOSALFORSETTLEMENT );
        require( msg.sender == _order.customer );

        if ( _accept ){
            Settlement memory _settlement = settlements[_orderId];
            _settlement.accepted = true;
            settlements[_orderId] = _settlement;

            payBasedProposal( _order, _settlement );
            _order.state = OrderState.REFUNDED;
        }else{
            _order.state = OrderState.FROZEN;
        }
        orders[_orderId] = _order;
        emit OrderStateChanged( _orderId, _order.state );
    }

    function unfroze( uint _orderId, uint _amount ) public {
        // Make sure the id is valid
        require(_orderId > 0 && _orderId <= orderCount);
        // Fetch the order
        Order memory _order = orders[_orderId];
        require(_order.state == OrderState.FROZEN );
        require( msg.sender == authority ); // block arbitration
        require(_order.costInTotal >= _amount );

        Settlement memory _settlement = settlements[_orderId];
        _settlement.decicedRefundAmount = _amount;
        settlements[_orderId] = _settlement;
        payBasedProposal( _order , _settlement );

        _order.state = OrderState.REFUNDED;
        orders[_orderId] = _order;
        emit OrderStateChanged( _orderId, _order.state );
    }

    function cancelOrder( uint _orderId ) public {
        // Make sure the id is valid
        require(_orderId > 0 && _orderId <= orderCount);
        // Fetch the post
        Order memory _order = orders[_orderId];

        // Role check
        require(_order.store == msg.sender ||
            _order.customer == msg.sender );

        // Order state check
        require(_order.state == OrderState.CREATED  ||
        _order.state == OrderState.PAID     ||
        _order.state == OrderState.ACCEPTED ||
            _order.state == OrderState.SHIPPED);

        if ( _order.state != OrderState.CREATED ){ // is payed
            // send back payment
            _order.customer.transfer( _order.costInTotal );
        }

        // update state
        _order.state = OrderState.CANCELLED;
        // update order
        orders[_orderId] = _order;
        emit OrderStateChanged( _orderId, _order.state );
    }

    function confirmationMechanism(uint _orderId, address _deliveryContractAdress ) public {
        // Check if provided address is smart contract
        require( Address.isContract(_deliveryContractAdress) );
        // Make sure the id is valid
        require(_orderId > 0 && _orderId <= orderCount);
        // Fetch the order
        Order memory _order = orders[_orderId];
        // Creating communication instance from adress
        DeliveryContract del = DeliveryContract(_deliveryContractAdress);

        if ( _order.state == OrderState.ACCEPTED ){
            // Required function of delivery contract for confirmation of
            // delivery act
            if ( del.isConfirmed(_orderId, _order.store, _order.deliverer ) ){
                _order.state = OrderState.SHIPPED;
            }
        }else if ( _order.state == OrderState.SHIPPED ){
            if ( del.isConfirmed( _orderId, _order.deliverer, _order.customer ) ){
                _order.state = OrderState.DELIVERED;
            }
        }else if ( _order.state == OrderState.DELIVERED ){
            if ( del.isConfirmed( _orderId, _order.customer, _order.deliverer ) ){
                _order.state = OrderState.SENTBACK;
            }
        }else if ( _order.state == OrderState.SENTBACK ){
            if ( del.isConfirmed( _orderId, _order.deliverer, _order.store ) ){
                _order.state = OrderState.RETURNED;
            }
        }
        orders[_orderId] = _order;
        emit OrderStateChanged( _orderId, _order.state );
    }


    function step( uint _orderId ) public {
        // Make sure the id is valid
        require(_orderId > 0 && _orderId <= orderCount);
        // Fetch the order
        Order memory _order = orders[_orderId];
        if ( _order.state == OrderState.DELIVERED ){
            // Check date of accepted
            _order.store.transfer( _order.costInTotal );
            _order.state = OrderState.COMPLETED;
            orders[_orderId] = _order;
            emit OrderStateChanged( _orderId, _order.state );
        }
    }

}
