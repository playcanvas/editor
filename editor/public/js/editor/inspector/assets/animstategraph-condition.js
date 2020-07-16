Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-animstategraph-condition';

    class AnimstategraphCondition extends pcui.Container {
        /**
         * Creates a new condition.
         * @param {Object} [args] The arguments
         */
        constructor(args) {
            args = Object.assign({
                class: CLASS_ROOT
            }, args);

            super(args);
            this._args = args;

            this.class.add(CLASS_ROOT);
        }
        link(assets, path) {
            const selectParameterName = new pcui.SelectInput({
                type: 'string',
                options: this._args.parameters.map(param => { return { v: param, t: param }}),
                value: assets[0].get(path).parameterName
            });
            selectParameterName.on('change', value => {
                const condition = assets[0].get(path);
                condition.parameterName = value;
                assets[0].set(path, condition);
            });
            this.append(selectParameterName);

            const selectPredicate = new pcui.SelectInput({
                type: 'string',
                options: [
                    {
                        v: ANIM_EQUAL_TO,
                        t: 'Equal To (=)',
                    },
                    {
                        v: ANIM_NOT_EQUAL_TO,
                        t: 'Not Equal To (!=)',
                    },
                    {
                        v: ANIM_LESS_THAN,
                        t: 'Less Than (<)',
                    },
                    {
                        v: ANIM_LESS_THAN_EQUAL_TO,
                        t: 'Less Than Equal To (<=)',
                    },
                    {
                        v: ANIM_GREATER_THAN,
                        t: 'Greater Than (>)',
                    },
                    {
                        v: ANIM_GREATER_THAN_EQUAL_TO,
                        t: 'Greater Than Equal To (>=)',
                    },
                ],
                value: assets[0].get(path).predicate
            });
            selectPredicate.on('change', value => {
                const condition = assets[0].get(path);
                condition.predicate = value;
                assets[0].set(path, condition);
            });
            this.append(selectPredicate);
            const condition = assets[0].get(path);
            const parameters = assets[0].get('data.parameters');
            const parameter = Object.keys(parameters).map(key => parameters[key]).filter(param => param.name === condition.parameterName)[0];
            if (parameter) {
                if ([ANIM_PARAMETER_BOOLEAN, ANIM_PARAMETER_TRIGGER].includes(parameter.type)) {
                    const valueInput = new pcui.BooleanInput({
                        value: assets[0].get(path).value
                    });
                    valueInput.on('change', value => {
                        const condition = assets[0].get(path);
                        condition.value = value;
                        assets[0].set(path, condition);
                    });
                    this.append(valueInput);
                } else {
                    const valueInput = new pcui.NumericInput({
                        value: assets[0].get(path).value,
                        precision: parameter.type === ANIM_PARAMETER_INTEGER ? 0 : undefined
                    });
                    valueInput.on('change', value => {
                        const condition = assets[0].get(path);
                        condition.value = value;
                        assets[0].set(path, condition);
                    });
                    this.append(valueInput);
                }
            }
            const removeButton = new pcui.Button({
                icon: 'E289'
            });
            removeButton.on('click', () => {
                this._args.onDelete();
            });
            this.append(removeButton);
        }
    }

    return {
        AnimstategraphCondition: AnimstategraphCondition 
    };
})());
