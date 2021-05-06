pragma solidity ^0.8.0;

contract DeliveryContract {

    mapping(uint => ConfirmationMechanism) public store;

    // Custom confirmation mechanism
    struct ConfirmationMechanism{
        address shippingCondignor;
        address shippingRecipient;

        address deliveringCondignor;
        address deliveringRecipient;

        address returningCondignor;
        address returningRecipient;

        address recievingCondignor;
        address recievingRecipient;

        ConfirmationState state;

        bool exists;  // workaround for existence
    }

    enum ConfirmationState{
        SHIPPING, DELIVERING, RETURNING, RECEIVING, RECEIVED
    }

    event ConfirmaionStateChanged(
        uint orderId,
        ConfirmationState state
    );

    function getConfirmation(uint _orderId) private view returns (ConfirmationMechanism memory conf){
        if ( store[_orderId].exists ) {
            return store[_orderId];
        }else{
            return ConfirmationMechanism( address(0), address(0),
                                          address(0), address(0),
                                          address(0), address(0),
                                          address(0), address(0),
                                          ConfirmationState.SHIPPING, true);
        }
    }

    function confirmShipment(uint _orderId) public {
        ConfirmationMechanism memory conf = getConfirmation( _orderId );
        if ( conf.state == ConfirmationState.SHIPPING ){
            require( conf.shippingCondignor == address(0) );
            conf.shippingCondignor = msg.sender;
        }
        if ( conf.state == ConfirmationState.DELIVERING ){
            require( conf.deliveringCondignor == address(0) );
            conf.deliveringCondignor = msg.sender;
        }
        if ( conf.state == ConfirmationState.RETURNING ){
            require( conf.returningCondignor == address(0) );
            conf.returningCondignor = msg.sender;
        }
        if ( conf.state == ConfirmationState.RECEIVING ){
             require( conf.recievingCondignor == address(0) );
             conf.recievingCondignor = msg.sender;
        }
        saveConf( _orderId , conf );
    }

    function confirmReceivment( uint _orderId ) public {
        ConfirmationMechanism memory conf = getConfirmation( _orderId );
        if ( conf.state == ConfirmationState.SHIPPING ){
            require( conf.shippingRecipient == address(0) );
            conf.shippingRecipient = msg.sender;
        }
        if ( conf.state == ConfirmationState.DELIVERING ){
            require( conf.deliveringRecipient == address(0) );
            conf.deliveringRecipient = msg.sender;
        }
        if ( conf.state == ConfirmationState.RETURNING ){
            require( conf.returningRecipient == address(0) );
            conf.returningRecipient = msg.sender;
        }
        if ( conf.state == ConfirmationState.RECEIVING ){
            require( conf.recievingRecipient == address(0) );
            conf.recievingRecipient = msg.sender;
        }
        saveConf( _orderId , conf );
    }

    function saveConf( uint _orderId, ConfirmationMechanism memory conf ) private {
        if ( conf.state == ConfirmationState.SHIPPING ){
            if ( conf.shippingRecipient != address(0) &&
                conf.shippingCondignor != address(0) ){
                conf.state = ConfirmationState.DELIVERING;
                emit ConfirmaionStateChanged( _orderId ,ConfirmationState.DELIVERING );
            }
        } else if ( conf.state == ConfirmationState.DELIVERING ){
            if ( conf.deliveringRecipient != address(0) &&
                conf.deliveringCondignor != address(0) ){
                conf.state = ConfirmationState.RETURNING;
                emit ConfirmaionStateChanged( _orderId ,ConfirmationState.RETURNING );
            }
        } else if ( conf.state == ConfirmationState.RETURNING ){
            if ( conf.returningRecipient != address(0) &&
                conf.returningCondignor != address(0) ){
                conf.state = ConfirmationState.RECEIVING;
                emit ConfirmaionStateChanged( _orderId ,ConfirmationState.RECEIVING );
            }
        }else if ( conf.state == ConfirmationState.RECEIVING ){
            if ( conf.recievingRecipient != address(0) &&
                 conf.recievingCondignor != address(0) ){
                conf.state = ConfirmationState.RECEIVED;
                emit ConfirmaionStateChanged( _orderId ,ConfirmationState.RECEIVED );
            }
        }
        store[_orderId] = conf;
    }

    function isConfirmed( uint _orderId, address consigor, address recipient ) public view returns ( bool eval ) {
        ConfirmationMechanism memory conf = getConfirmation( _orderId );
        if ( conf.shippingCondignor == consigor &&
            conf.shippingRecipient == recipient){
            return true;
        }

        if ( conf.deliveringCondignor == consigor &&
            conf.deliveringRecipient == recipient){
            return true;
        }

        if ( conf.returningCondignor == consigor &&
            conf.returningRecipient == recipient){
            return true;
        }

        if ( conf.recievingCondignor == consigor &&
            conf.recievingRecipient == recipient){
            return true;
        }

        return false;
}

}
