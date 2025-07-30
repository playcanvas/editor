import { fields as anim } from './anim.ts';
import { fields as animation } from './animation.ts';
import { fields as audiolistener } from './audiolistener.ts';
import { fields as audiosource } from './audiosource.ts';
import { fields as button } from './button.ts';
import { fields as camera } from './camera.ts';
import { fields as collision } from './collision.ts';
import { fields as element } from './element.ts';
import { fields as gsplat } from './gsplat.ts';
import { fields as layoutchild } from './layoutchild.ts';
import { fields as layoutgroup } from './layoutgroup.ts';
import { fields as light } from './light.ts';
import { fields as model } from './model.ts';
import { fields as particlesystem } from './particlesystem.ts';
import { fields as render } from './render.ts';
import { fields as rigidbody } from './rigidbody.ts';
import { fields as screen } from './screen.ts';
import { fields as script } from './script.ts';
import { fields as scrollView } from './scroll-view.ts';
import { fields as scrollbar } from './scrollbar.ts';
import { fields as sound } from './sound.ts';
import { fields as soundslot } from './soundslot.ts';
import { fields as spriteAnimationClip } from './sprite-animation-clip.ts';
import { fields as sprite } from './sprite.ts';
import { fields as zone } from './zone.ts';

editor.once('load', () => {
    /**
     * @type {AttributeReference[]}
     */
    const fields = [
        ...anim,
        ...animation,
        ...audiolistener,
        ...audiosource,
        ...button,
        ...camera,
        ...collision,
        ...element,
        ...gsplat,
        ...layoutchild,
        ...layoutgroup,
        ...light,
        ...model,
        ...particlesystem,
        ...render,
        ...rigidbody,
        ...screen,
        ...script,
        ...scrollView,
        ...scrollbar,
        ...sound,
        ...soundslot,
        ...spriteAnimationClip,
        ...sprite,
        ...zone
    ];

    for (let i = 0; i < fields.length; i++) {
        editor.call('attributes:reference:add', fields[i]);
    }
});
