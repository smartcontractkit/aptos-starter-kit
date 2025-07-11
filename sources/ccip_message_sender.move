module ccip_ra::ccip_message_sender {
    use std::vector;
    use ccip_router::router;
    use ccip::client;
    use ccip::eth_abi;

    public entry fun send_message(
        caller: &signer,
        dest_chain_selector: u64,
        receiver: vector<u8>,
        message_data: vector<u8>,
        fee_token: address,
        fee_token_store: address,
    ) {
        // Create extra_args based on destination chain type
        let extra_args = client::encode_generic_extra_args_v2(100000, true);
        
        router::ccip_send(
            caller,
            dest_chain_selector,
            receiver,
            message_data,
            vector::empty<address>(),  // No token transfers
            vector::empty<u64>(),      // No token amounts
            vector::empty<address>(),  // No token stores
            fee_token,
            fee_token_store,
            extra_args
        );
    } 

    // Token transfers
    public entry fun send_tokens(
        caller: &signer,
        dest_chain_selector: u64,
        receiver: vector<u8>,
        token_addresses: vector<address>,
        token_amounts: vector<u64>,
        token_store_addresses: vector<address>,
        fee_token: address,
        fee_token_store: address
    ) {
        // Create extra_args based on destination chain type
        let extra_args = client::encode_generic_extra_args_v2(100000, true);
        
        router::ccip_send(
            caller,
            dest_chain_selector,
            receiver,
            vector::empty<u8>(),      // No message data
            token_addresses,
            token_amounts,
            token_store_addresses,
            fee_token,
            fee_token_store,
            extra_args
        );
    }

    // Message with token transfers
    public entry fun send_message_with_tokens(
        caller: &signer,
        dest_chain_selector: u64,
        receiver: vector<u8>,
        message_data: vector<u8>,
        token_addresses: vector<address>,
        token_amounts: vector<u64>,
        token_store_addresses: vector<address>,
        fee_token: address,
        fee_token_store: address
    ) {
        // Create extra_args based on destination chain type
        let extra_args = client::encode_generic_extra_args_v2(100000, true);
        
        router::ccip_send(
            caller,
            dest_chain_selector,
            receiver,
            message_data,
            token_addresses,
            token_amounts,
            token_store_addresses,
            fee_token,
            fee_token_store,
            extra_args
        );
    }
}