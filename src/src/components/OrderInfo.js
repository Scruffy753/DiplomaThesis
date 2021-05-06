import React, { Component } from 'react';
import NonCreatedOrderTable from "./NonCreatedOrderTable";

class OrderInfo extends Component{

    render() {
        return (
            <div>
                <h1>Order Contract</h1>

                <h2>Order #{ this.props.order.id }
                    { this.props.order.store === this.props.account &&
                    <span className="badge bg-primary text-light">Store</span> }
                    { this.props.order.customer === this.props.account &&
                    <span className="badge bg-primary text-light">Customer</span>}
                    { this.props.order.deliverer === this.props.account &&
                    <span className="badge bg-primary text-light">Deliverer</span>}
                </h2>

                <table className="table">
                    <tbody>
                    <tr>
                        <th scope="row">Store adress:</th>
                        <td>{this.props.order.store}</td>
                    </tr>
                    <tr>
                        <th scope="row">Customer adress:</th>
                        <td>{this.props.order.customer}</td>
                    </tr>
                    <tr>
                        <th scope="row">Deliverer adress:</th>
                        <td colSpan="2">{this.props.order.deliverer}</td>
                    </tr>
                    <tr>
                        <th scope="row">Cost in total:</th>
                        <td colSpan="2">{this.props.order.costInTotal}</td>
                    </tr>
                    <tr>
                        <th scope="row">Order State</th>
                        <td className="table-info" colSpan="2">{ this.props.orderState }</td>
                    </tr>
                    </tbody>
                </table>

            </div>
        );
    }
}

export default OrderInfo;

