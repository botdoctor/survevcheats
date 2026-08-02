export function smokeOpacity(){
    console.log('smokeopacity')
    
    const particles = unsafeWindow.game.smokeBarn.particles;
    console.log('smokeopacity', particles, unsafeWindow.game.smokeBarn.particles)
    particles.push = new Proxy( particles.push, {
        apply( target, thisArgs, args ) {
            console.log('smokeopacity', args[0]);
            const particle = args[0];

            Object.defineProperty(particle.sprite, 'alpha', {
                get() {
                    return state.isSmokeOpacityEnabled ? 0.12 : this._survevGptAlpha ?? 1;
                },
                set(value) {
                    this._survevGptAlpha = value;
                }
            });

            return Reflect.apply( ...arguments );

        }
    });

    particles.forEach(particle => {
        Object.defineProperty(particle.sprite, 'alpha', {
            get() {
                return state.isSmokeOpacityEnabled ? 0.12 : this._survevGptAlpha ?? 1;
            },
            set(value) {
                this._survevGptAlpha = value;
            }
        });
    });
}
import { state } from '../vars.js';
