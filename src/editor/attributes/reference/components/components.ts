import { fields as anim } from './anim';
import { fields as animation } from './animation';
import { fields as audiolistener } from './audiolistener';
import { fields as audiosource } from './audiosource';
import { fields as button } from './button';
import { fields as camera } from './camera';
import { fields as collision } from './collision';
import { fields as element } from './element';
import { fields as gsplat } from './gsplat';
import { fields as layoutchild } from './layoutchild';
import { fields as layoutgroup } from './layoutgroup';
import { fields as light } from './light';
import { fields as model } from './model';
import { fields as particlesystem } from './particlesystem';
import { fields as render } from './render';
import { fields as rigidbody } from './rigidbody';
import { fields as screen } from './screen';
import { fields as script } from './script';
import { fields as scrollView } from './scroll-view';
import { fields as scrollbar } from './scrollbar';
import { fields as sound } from './sound';
import { fields as soundslot } from './soundslot';
import { fields as sprite } from './sprite';
import { fields as spriteAnimationClip } from './sprite-animation-clip';
import { fields as zone } from './zone';
import type { AttributeReference } from '../reference.type';

editor.once('load', () => {
    const fields: AttributeReference[] = [
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
