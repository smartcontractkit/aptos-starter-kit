module receiver::ccip_message_receiver {
    use std::account;
    use std::event;
    use std::object::{Self, Object};
    use std::option::{Self, Option};
    use std::string::{Self, String};
    use std::resource_account;
    use std::fungible_asset::{Self, Metadata};
    use std::primary_fungible_store;
    use std::from_bcs;
    use std::signer;

    use ccip::client;
    use ccip::receiver_registry;

    #[event]
    struct ReceivedMessage has store, drop {
        message: String,
    }

    #[event]
    struct ReceivedTokens has store, drop {
        token_addresses: vector<address>,
        token_amounts: vector<u64>,
    }

    #[event]
    struct ForwardedTokensToFinalRecipient has store, drop {
        final_recipient: address,
    }

    // An enum to wrap all possible events
    #[event]
    enum ReceiverEvent has store, drop {
        Message(ReceivedMessage),
        Tokens(ReceivedTokens),
        Forwarded(ForwardedTokensToFinalRecipient),
    }

    struct CCIPReceiverState has key {
        signer_cap: account::SignerCapability,
        // The handle is now generic over the enum type
        handle: event::EventHandle<ReceiverEvent>,
    }

    /// A resource to hold a message received by the receiver.
    struct Message has key {
        message: String,
    }

    /// A resource to hold the final recipient of tokens forwarded by the receiver.
    struct TokensForwardedTo has key {
        final_recipient: address,
    }

    /// A resource to hold the tokens and their amounts that are received by the receiver.
    struct Tokens has key {
        token_addresses: vector<address>,
        token_amounts: vector<u64>,
    }

    const E_UNAUTHORIZED: u64 = 1;
    const E_INVALID_TOKEN_ADDRESS: u64 = 2;
    const E_NO_TOKENS_AVAILABLE_TO_WITHDRAW: u64 = 3;

    #[view]
    public fun type_and_version(): String {
        string::utf8(b"CCIPReceiver 1.6.0")
    }

    #[view]
    public fun latest_message(): String acquires Message {
        if (exists<Message>(@receiver)) {
            let state = borrow_global<Message>(@receiver);
            state.message
        } else {
            string::utf8(b"No message string received yet!")
        }
    }

    const MODULE_NAME: vector<u8> = b"ccip_message_receiver";

    fun init_module(publisher: &signer) {
        let signer_cap =
            resource_account::retrieve_resource_account_cap(publisher, @deployer);
        let handle = account::new_event_handle(publisher);

        move_to(
            publisher,
            CCIPReceiverState { signer_cap, handle }
        );

        receiver_registry::register_receiver(publisher, MODULE_NAME, CCIPReceiverProof {});
    }

    struct CCIPReceiverProof has drop {}

    public fun ccip_receive<T: key>(_metadata: Object<T>): Option<u128> acquires CCIPReceiverState {
        /* load state and rebuild a signer for the resource account */
        let state = borrow_global_mut<CCIPReceiverState>(@receiver);
        let state_signer = account::create_signer_with_capability(&state.signer_cap);

        let message = receiver_registry::get_receiver_input(
            @receiver, CCIPReceiverProof {}
        );

        let data = client::get_data(&message);
        
        let dest_token_amounts = client::get_dest_token_amounts(&message);

        if (dest_token_amounts.length() != 0 && data.length() != 0) {
            let final_recipient = from_bcs::to_address(data);

            for (i in 0..dest_token_amounts.length()) {
                let token_amount_ref = &dest_token_amounts[i];
                let token_addr = client::get_token(token_amount_ref);
                let amount = client::get_amount(token_amount_ref);

                // Implement the token transfer logic here

                let fa_token = object::address_to_object<Metadata>(token_addr);
                let fa_store_sender =
                    primary_fungible_store::ensure_primary_store_exists(@receiver, fa_token);
                let fa_store_receiver =
                    primary_fungible_store::ensure_primary_store_exists(
                        final_recipient, fa_token
                    );

                fungible_asset::transfer(
                    &state_signer,
                    fa_store_sender,
                    fa_store_receiver,
                    amount
                );
            };

            move_to(&state_signer, TokensForwardedTo { final_recipient });

            event::emit(ForwardedTokensToFinalRecipient { final_recipient });
            event::emit_event(&mut state.handle, ReceiverEvent::Forwarded(ForwardedTokensToFinalRecipient { final_recipient }));

        } else if (data.length() != 0) {
            
            // Convert the vector<u8> to a string
            let message = string::utf8(data);

            move_to(&state_signer, Message { message });

            event::emit( ReceivedMessage { message });
            event::emit_event(&mut state.handle, ReceiverEvent::Message( ReceivedMessage { message }));

        };

        // Simple abort condition for testing
        if (data == b"abort") {
            abort 1
        };

        option::none()
    }

    public entry fun withdraw_tokens(
        sender: &signer, 
        recipient: address, 
        token_address: address,
    ) acquires CCIPReceiverState {

        assert!(exists<CCIPReceiverState>(@receiver) && signer::address_of(sender) == @deployer, E_UNAUTHORIZED);

        let state = borrow_global_mut<CCIPReceiverState>(@receiver);
        let state_signer = account::create_signer_with_capability(&state.signer_cap);

        let fa_token = object::address_to_object<Metadata>(token_address);
        let fa_store_sender =
            primary_fungible_store::ensure_primary_store_exists(@receiver, fa_token);
        let fa_store_receiver =
            primary_fungible_store::ensure_primary_store_exists(
                recipient, fa_token
            );

        let balance = fungible_asset::balance(fa_store_sender);

        // Check if there are tokens available to withdraw
        assert!(balance > 0, E_NO_TOKENS_AVAILABLE_TO_WITHDRAW);

        fungible_asset::transfer(
            &state_signer,
            fa_store_sender,
            fa_store_receiver,
            fungible_asset::balance(fa_store_sender)
        );
    }
}