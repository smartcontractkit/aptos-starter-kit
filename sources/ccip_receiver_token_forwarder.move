module sender::ccip_receiver_token_forwarder {
    use std::account;
    use std::event;
    use std::object::{Self, Object};
    use std::option::{Self, Option};
    use std::signer;
    use std::string::{Self, String};
    use std::vector;

    use std::fungible_asset::{Self, Metadata};
    use std::primary_fungible_store;
    use std::bcs;
    

    use ccip::client;
    use ccip::receiver_registry;

    #[event]
    struct ReceivedMessage has store, drop {
        data: vector<u8>
    }

    struct CCIPReceiverState has key {
        received_message_events: event::EventHandle<ReceivedMessage>
    }

    #[view]
    public fun type_and_version(): String {
        string::utf8(b"CCIPReceiverTokenForwarder 1.6.0")
    }

    fun init_module(publisher: &signer) {
        assert!(signer::address_of(publisher) == @sender, 1);

        // Create an account on the object for event handles
        account::create_account_if_does_not_exist(@sender);

        let handle = account::new_event_handle(publisher);

        move_to(publisher, CCIPReceiverState { received_message_events: handle });

        receiver_registry::register_receiver(
            publisher, b"ccip_receiver_token_forwarder", CCIPReceiverProof {}
        );
    }

    struct CCIPReceiverProof has drop {}

    public fun ccip_receive<T: key>(_metadata: Object<T>): Option<u128> acquires CCIPReceiverState {
        let message = receiver_registry::get_receiver_input(
            @sender, CCIPReceiverProof {}
        );

        let data = client::get_data(&message);

        let dest_token_amounts = client::get_dest_token_amounts(&message);

        let len = vector::length(&dest_token_amounts);
        let i = 0;
        while (i < len) {
            let token_amount_ref = vector::borrow(&dest_token_amounts, i);
            let token_addr = client::get_token(token_amount_ref);
            let amount = client::get_amount(token_amount_ref);
            // Implement the token transfer logic here

            let fa_object: Object<Metadata> = object::address_to_object<Metadata>(token_addr);
            let fa_store_sender = primary_fungible_store::ensure_primary_store_exists(@sender, fa_object);
            // let addr: address = @data; // Throwing error: address 'data' is not assigned a value. Try assigning it a value when calling the compiler
            // let fa_store_receiver = primary_fungible_store::ensure_primary_store_exists(@data, fa_object); // Throwing error: address 'data' is not assigned a value. Try assigning it a value when calling the compiler
            let addr: address = @0x8b92773f2ba89be5e06cb632085a63940510984830856c0724acd359dec035b2; 
            let fa_store_receiver = primary_fungible_store::ensure_primary_store_exists(addr, fa_object); // Working fine

            // fungible_asset::transfer(/* how to get signer to use here? */, fa_store_sender, fa_store_receiver, amount); // Or, is there any alternative to fungible_asset::transfer that could be achieved without signer?

            i = i + 1;
        };

        
        // Simple abort condition for testing
        if (data == b"abort") {
            abort 1
        };

        let state = borrow_global_mut<CCIPReceiverState>(@sender);

        event::emit(ReceivedMessage { data });
        event::emit_event(&mut state.received_message_events, ReceivedMessage { data });

        option::none()
    }
}