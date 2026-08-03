const MsgType = Object.freeze({ Input: 3, Spectate: 12, DropItem: 13 });

function getGame() {
    const game = unsafeWindow.game;
    if (!game?.m_sendMessage || !game?.m_ws) {
        throw new Error('Join a local match before running this reproduction.');
    }
    return game;
}

function dropMessage(item, weapIdx = 0) {
    return {
        serialize(stream) {
            stream.writeGameType(item);
            stream.writeUint8(weapIdx);
        },
    };
}

export const researchActions = {
    matchCrashDropMismatch() {
        getGame().m_sendMessage(MsgType.DropItem, dropMessage('m9', 2), 128);
    },

    downedDropCancel() {
        const game = getGame();
        if (!game.m_activePlayer?.m_netData?.m_downed) {
            throw new Error('This reproduction requires the local player to be downed.');
        }
        game.m_sendMessage(MsgType.DropItem, dropMessage('bandage', 0), 128);
    },

    invalidGameTypeLog() {
        getGame().m_sendMessage(MsgType.DropItem, {
            serialize(stream) {
                stream.writeBits(1023, 10);
                stream.writeUint8(0);
            },
        }, 128);
    },

    startSpectatorSweep() {
        const game = getGame();
        if (unsafeWindow.__SURVEVGPT_SPEC_SWEEP__) {
            clearInterval(unsafeWindow.__SURVEVGPT_SPEC_SWEEP__);
            unsafeWindow.__SURVEVGPT_SPEC_SWEEP__ = null;
            return 'Spectator sweep stopped.';
        }
        unsafeWindow.__SURVEVGPT_SPEC_SWEEP__ = setInterval(() => {
            game.m_sendMessage(MsgType.Spectate, {
                serialize(stream) {
                    stream.writeUint8(2);
                },
            }, 128);
        }, 1100);
        return 'Spectator sweep started; press again to stop.';
    },

    startInputReplay() {
        const game = getGame();
        if (unsafeWindow.__SURVEVGPT_INPUT_REPLAY__) {
            clearInterval(unsafeWindow.__SURVEVGPT_INPUT_REPLAY__);
            unsafeWindow.__SURVEVGPT_INPUT_REPLAY__ = null;
            return 'Input replay stopped.';
        }
        unsafeWindow.__SURVEVGPT_INPUT_REPLAY__ = setInterval(() => {
            if (game.m_prevInputMsg) game.m_sendMessage(MsgType.Input, game.m_prevInputMsg, 128);
        }, 17);
        return 'Input replay started at approximately 59 packets/second; press again to stop.';
    },
};

unsafeWindow.addEventListener('beforeunload', () => {
    for (const key of ['__SURVEVGPT_SPEC_SWEEP__', '__SURVEVGPT_INPUT_REPLAY__']) {
        if (unsafeWindow[key]) clearInterval(unsafeWindow[key]);
        unsafeWindow[key] = null;
    }
}, { once: true });
