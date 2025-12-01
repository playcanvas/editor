import type { AttributeReference } from '../reference.type';

export const fields: AttributeReference[]  = [
    {
        name: 'asset:anim:transition:from',
        title: 'Source',
        description: 'The state that this transition will exit from.'
    },
    {
        name: 'asset:anim:transition:to',
        title: 'Destination',
        description: 'The state that this transition will transition to.'
    },
    {
        name: 'asset:anim:transition:time',
        title: 'Duration',
        description: 'The duration of the transition in seconds.'
    },
    {
        name: 'asset:anim:transition:exitTime',
        title: 'Exit Time',
        description: 'The time at which to exit the source state and enter the destination state. Given in normalized time based on the source state\'s duration (1 means the full length of the animation. 0.5 is the half of the animation). A value of 0 disables the exit time and allows the source state to exit with this transition at any time. A value of less than 1 will make the transition available for exit at that time during every loop of the source state. A value of more than 1 will make the transition available once after a fixed number of loops (2.5 means after two and a half loops).'
    },
    {
        name: 'asset:anim:transition:priority',
        title: 'Priority',
        description: 'Used to sort all matching transitions in ascending order. The first transition in the sorted list will be selected.'
    },
    {
        name: 'asset:anim:transition:transitionOffset',
        title: 'Transition Offset',
        description: 'If provided, the destination state will begin playing its animation at this time. Given in normalized time based on the destinations states duration. Must be between 0 and 1.'
    },
    {
        name: 'asset:anim:transition:interruptionSource',
        title: 'Interruption Source',
        description: 'Defines whether another transition can interrupt this one and which of the current or previous states transitions can do so.'
    },
    {
        name: 'asset:anim:transition:conditions',
        title: 'Conditions',
        description: 'Conditions are used to test whether a transition should activate. If all conditions pass the transition will become active. Each condition tests the current value of a parameter against a provided value using the selected predicate.'
    }
];
