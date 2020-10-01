editor.once('load', function() {
    'use strict';

    var fields = [
        {
            name: 'from',
            title: 'Source',
            description: 'The state that this transition will exit from.'
        },
        {
            name: 'to',
            title: 'Destination',
            description: 'The state that this transition will transition to.'
        },
        {
            name: 'time',
            title: 'Duration',
            description: 'The duration of the transition in seconds.'
        },
        {
            name: 'exitTime',
            title: 'Exit Time',
            description: 'If provided, this transition will only be active for the exact frame during which the source states progress passes the time specified. Given as a normalised value of the source states duration. Values less than 1 will be checked every animation loop.'
        },
        {
            name: 'priority',
            title: 'Priority',
            description: 'Used to sort all matching transitions in ascending order. The first transition in the sorted list will be selected.'
        },
        {
            name: 'transitionOffset',
            title: 'Transition Offset',
            description: 'If provided, the destination state will begin playing its animation at this time. Given in normalised time based on the destinations states duration. Must be between 0 and 1.'
        },
        {
            name: 'interruptionSource',
            title: 'Interruption Source',
            description: 'Defines whether another transition can interrupt this one and which of the current or previous states transitions can do so.'
        },
        {
            name: 'conditions',
            title: 'Conditions',
            description: 'Conditions are used to test whether a transition should activate. If all conditions pass the transition will become active. Each condition tests the current value of a parameter against a provided value using the selected predicate.'
        }
    ];

    for(var i = 0; i < fields.length; i++) {
        fields[i].name = 'asset:anim:transition:' + (fields[i].name || fields[i].title);
        editor.call('attributes:reference:add', fields[i]);
    }
});
