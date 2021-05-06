import React, { Component } from 'react';

class NonCreatedOrderTable extends Component{

    render() {
        return (
            <div>
                <h1>Order details</h1>
                <table className="table">
                    <tbody>
                    <tr>
                        <th scope="row">Store Adress:</th>
                        <td> {this.props.order.storeAdress} </td>
                    </tr>
                    <tr>
                        <th scope="row">Customer Adress:</th>
                        <td>{this.props.customerAddress}</td>
                    </tr>
                    <tr>
                        <th scope="row">Deliverer Adress:</th>
                        <td colSpan="2">{this.props.order.delivererAddress}</td>
                    </tr>
                    <tr>
                        <th scope="row">Delivery info</th>
                        <td colSpan="2">{this.props.order.deliveryAddress}</td>
                    </tr>
                    <tr>
                        <th scope="row">Cost</th>
                        <td colSpan="2">{this.props.order.cost}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}

export default NonCreatedOrderTable;