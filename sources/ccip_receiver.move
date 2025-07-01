module sender::dummy_receiver {
    use std::account;
    use std::event;
    use std::object::Object;
    use std::option::{Self, Option};
    use std::signer;
    use std::string::{Self, String};

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
        string::utf8(b"DummyReceiver 1.6.0")
    }

    fun init_module(publisher: &signer) {
        assert!(signer::address_of(publisher) == @sender, 1);

        // Create an account on the object for event handles
        account::create_account_if_does_not_exist(@sender);

        let handle = account::new_event_handle(publisher);

        move_to(publisher, CCIPReceiverState { received_message_events: handle });

        receiver_registry::register_receiver(
            publisher, b"dummy_receiver", DummyReceiverProof {}
        );
    }

    struct DummyReceiverProof has drop {}

    public fun ccip_receive<T: key>(_metadata: Object<T>): Option<u128> acquires CCIPReceiverState {
        let message = receiver_registry::get_receiver_input(
            @sender, DummyReceiverProof {}
        );
        let data = client::get_data(&message);
        
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