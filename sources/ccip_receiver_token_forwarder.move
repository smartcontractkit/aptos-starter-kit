module sender::ccip_receiver_token_forwarder {
    use std::account;
    use std::event;
    use std::object::{Self, Object};
    use std::option::{Self, Option};
    use std::string::{Self, String};
    use std::resource_account;

    use std::fungible_asset::{Self, Metadata};
    use std::primary_fungible_store;
    use std::from_bcs;

    use ccip::client;
    use ccip::receiver_registry;

    #[event]
    struct ReceivedMessage has store, drop {
        data: vector<u8>
    }

    struct CCIPReceiverState has key {
        signer_cap: account::SignerCapability,
        received_message_events: event::EventHandle<ReceivedMessage>
    }

    #[view]
    public fun type_and_version(): String {
        string::utf8(b"CCIPReceiverTokenForwarder 1.6.0")
    }

    const MODULE_NAME: vector<u8> = b"ccip_receiver_token_forwarder";

    fun init_module(publisher: &signer) {
        let signer_cap =
            resource_account::retrieve_resource_account_cap(publisher, @deployer);
        let handle = account::new_event_handle(publisher);

        move_to(
            publisher,
            CCIPReceiverState { signer_cap, received_message_events: handle }
        );

        receiver_registry::register_receiver(publisher, MODULE_NAME, CCIPReceiverProof {});
    }

    struct CCIPReceiverProof has drop {}

    public fun ccip_receive<T: key>(_metadata: Object<T>): Option<u128> acquires CCIPReceiverState {
        /* load state and rebuild a signer for the resource account */
        let state = borrow_state_mut();
        let state_signer = account::create_signer_with_capability(&state.signer_cap);

        let message = receiver_registry::get_receiver_input(
            @sender, CCIPReceiverProof {}
        );

        let data = client::get_data(&message);
        let receiver_addr = from_bcs::to_address(data);
        let dest_token_amounts = client::get_dest_token_amounts(&message);

        for (i in 0..dest_token_amounts.length()) {
            let token_amount_ref = &dest_token_amounts[i];
            let token_addr = client::get_token(token_amount_ref);
            let amount = client::get_amount(token_amount_ref);

            // Implement the token transfer logic here

            let fa_token = object::address_to_object<Metadata>(token_addr);
            let fa_store_sender =
                primary_fungible_store::ensure_primary_store_exists(@sender, fa_token);
            let fa_store_receiver =
                primary_fungible_store::ensure_primary_store_exists(
                    receiver_addr, fa_token
                );

            fungible_asset::transfer(
                &state_signer,
                fa_store_sender,
                fa_store_receiver,
                amount
            );
        };

        // Simple abort condition for testing
        if (data == b"abort") {
            abort 1
        };

        event::emit(ReceivedMessage { data });
        event::emit_event(&mut state.received_message_events, ReceivedMessage { data });

        option::none()
    }

    inline fun borrow_state_mut(): &mut CCIPReceiverState {
        borrow_global_mut<CCIPReceiverState>(@sender)
    }
}
