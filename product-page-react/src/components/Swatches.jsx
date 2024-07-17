function Swatches({ optn, option_index, selectedOptions, onSelectOption }) {
    return (
        <>
            <legend>{optn.option_title}:</legend>
            {
                !!optn?.option_values &&
                optn.option_values.map(option_value => {

                    let background_color = ''

                    if ( option_value.option_value_title.includes('Platinum') ) {
                        background_color = '#a4a3a1'
                    } else if ( option_value.option_value_title.includes('White') ) {
                        background_color = '#cfcac9'
                    } else if ( option_value.option_value_title.includes('Yellow') ) {
                        background_color = '#e5bf11'
                    } else if ( option_value.option_value_title.includes('Rose') ) {
                        background_color = '#d6a289'
                    }

                    let metal_type_text = ''

                    if ( option_value.option_value_title.split(/ (.*)/s).length > 1 ) {
                        metal_type_text = option_value.option_value_title.split(/ (.*)/s)[1]
                    } else {
                        metal_type_text = option_value.option_value_title
                    }

                    return (
                        <>
                            <label htmlFor={option_value.option_value_id}>

                                <span className='tooltiptext'>{option_value.option_value_title}</span>

                                {
                                    !!option_value.option_image_path
                                    &&
                                    <img src={`/apps/jewelry-builder-app${option_value.option_image_path}`} alt="" />
                                }

                                {
                                    ( optn.option_slug === "metal_type" )
                                    &&
                                    <span className="metal_type_color" style={{ background: background_color }}>
                                        {
                                            ( option_value.option_value_title.split(' ').length > 1 ) ? option_value.option_value_title.split(' ')[0] : ''
                                        }
                                    </span>
                                }

                                {
                                    <span className={ ( optn.option_slug === "center_stone_type" ) ? 'option_value_title' : '' }>
                                        {
                                            (optn.option_slug === 'center_stone_shape' )
                                            ?
                                            ''
                                            :
                                            (
                                                ( optn.option_slug === "metal_type" )
                                                ?
                                                metal_type_text
                                                :
                                                option_value.option_value_title
                                            )
                                        }
                                    </span>
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