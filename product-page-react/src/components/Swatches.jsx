function Swatches({ optn, option_index, selectedOptions, onSelectOption }) {
    return (
        <>
            <legend>{optn.option_title}:</legend>
            {
                !!optn?.option_values &&
                optn.option_values.map(option_value => {
                    return (
                        <>
                            <label htmlFor={option_value.option_value_id}>

                            <span className='tooltiptext'>{option_value.option_value_title}</span>

                            {
                                !!option_value.option_image_path
                                ?
                                <img src={`/apps/product-options${option_value.option_image_path}`} alt="" />
                                :
                                option_value.option_value_title
                            }
                            <input
                                type="radio"
                                name={`properties[${optn.option_title}]`}
                                value={option_value.option_value_title}
                                id={option_value.option_value_id}
                                onClick={() => onSelectOption(option_index, optn, option_value)}
                                checked={selectedOptions[option_index]?.option_value_id === option_value.option_value_id}
                            />
                            </label>
                        </>
                    )
                })
            }
        </>
    )
}

export default Swatches