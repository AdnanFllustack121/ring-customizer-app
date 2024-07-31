import { useEffect } from 'react';

// core version + navigation, pagination modules:
// import { Swiper, SwiperSlide } from 'swiper/react';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
// import Swiper and modules styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


function MediaWrapper({
  allMedias,
  setAllMedias,

  metaFieldData,

  featuredMediaIndex,
  setFeaturedMediaIndex,

  isFirstUnavailable,
  setIsFirstUnavailable
}) {


  useEffect(() => {

    console.log('allMedias useEffect MediaWrapper allMedias', allMedias)

    if (!document.querySelector('.swiper')?.swiper) {
      console.log("!document.querySelector('.swiper')?.swiper", !document.querySelector('.swiper')?.swiper)
      const swiper = new Swiper('.swiper', {
  
        grabCursor: true,
  
        // configure Swiper to use modules
        modules: [Navigation, Pagination],
  
        observer: true,
        observeParents: true,
        observeSlideChildren: true,
  
        // If we need pagination
        pagination: {
          el: '.swiper-pagination',
          clickable: true
        },
  
        // Navigation arrows
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
  
      })

      console.log('allMedias useEffect swiper', swiper)
    } else {
      console.log('allMedias useEffect swiper update')
      document.querySelector('.swiper').swiper.update()
    }

    return () => {
      console.log("allMedias useEffect swiper cleaned up")
      if (!!document.querySelector('.swiper')?.swiper) {
        // document.querySelector('.swiper').swiper.destroy()
      }
    }


  }, [allMedias])


  useEffect(() => {
    console.log('useEffect featuredMediaIndex', featuredMediaIndex)

    if (document.querySelector('.swiper') && document.querySelector('.swiper').swiper) {
      document.querySelector('.swiper').swiper.slideTo(featuredMediaIndex)
    }

  }, [featuredMediaIndex])


  function handleGalleryImageClick(singleMediaIndex, singleMedia) {

    console.log('handleGalleryImageClick singleMediaIndex, singleMedia', singleMediaIndex, singleMedia)

    // const foundSlide = document.querySelector(`.swiper-slide[src="${singleMedia}"]`)
    const foundSlide = document.querySelector(`div.swiper-slide [src="${singleMedia}"]`).closest('.swiper-slide')
    console.log('foundSlide', foundSlide)

    let foundSlideIndex

    if (!!foundSlide?.parentNode) {
      foundSlideIndex = Array.from(foundSlide.parentNode.children).indexOf(foundSlide)
    } else {
      console.log('foundSlide?.parentNode', foundSlide?.parentNode)
      // console.log('foundSlide', foundSlide)
      foundSlideIndex = document.querySelectorAll('.swiper-slide').length - 1
    }

    console.log('foundSlideIndex', foundSlideIndex)

    setFeaturedMediaIndex(foundSlideIndex)
  }


  return (
    <div id="jewelry-builder-app-media-wrapper">
      {
        !!allMedias?.length && (featuredMediaIndex !== null)
        ?
        <>
          {/* Slider main container */}
          <div className='swiper'>
          {/* <Swiper
            navigation={{
              // enabled: true,
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev'
            }}
          > */}
            <div className="swiper-wrapper">
              {console.log('nclds 9', allMedias, featuredMediaIndex)}
              {/* {
                allMedias[featuredMediaIndex].includes('mp4')
                ?
                <video className="video-player" id="myVideo" width="100%" height="100%" autoplay="autoplay" loop="loop">
                  <source src={allMedias[featuredMediaIndex]} type="video/mp4" />
                </video>
                :
                <img
                  id='image-main'
                  src={
                    allMedias[featuredMediaIndex].includes('http') ? allMedias[featuredMediaIndex] : `/apps/jewelry-builder-app${allMedias[featuredMediaIndex]}`
                  }
                />
              } */}

              {allMedias.map((thisMedia) => {

                console.log('thisMedia', thisMedia)

                if (thisMedia) {

                  return (
                    <div className='swiper-slide'>
                    {/* <SwiperSlide> */}
                      {
                        thisMedia.includes('mp4')
                        ?
                        <video id="myVideo" className="video-player" width="100%" height="100%" autoplay="autoplay" loop="loop" src={thisMedia}>
                          <source src={thisMedia} type="video/mp4" />
                        </video>
                        :
                        <img
                          id='image-main'
                          src={
                            thisMedia.includes('http') ? thisMedia : `/apps/jewelry-builder-app${thisMedia}`
                          }
                        />
                      }
                    {/* </SwiperSlide> */}
                    </div>
                  )

                } else {
                  return <></>
                }

              })}

            </div>

            {/* If we need pagination */}
            <div className="swiper-pagination"></div>

            {/* If we need navigation buttons */}
            <div className="swiper-button-prev"></div>
            <div className="swiper-button-next"></div>

          {/* </Swiper> */}
          </div>

          <ul className="product-image-thumbs">
            {allMedias.map((singleMedia, singleMediaIndex) => {

              {console.log('nclds 10')}

              return (
                <>
                  {
                    !singleMedia
                    ?
                    <></>
                    :
                    (
                      !singleMedia.includes('mp4')
                      ?
                      <li>
                        <a
                          className="thumb-link"
                          title=""
                          data-image-index={singleMediaIndex}
                          onClick={() => { handleGalleryImageClick(singleMediaIndex, singleMedia) }}
                        >
                          <img
                            src={singleMedia}
                            width="75"
                            height="75"
                            alt=""
                            onLoad={(event) => {
                              // console.log('onLoad event', event)
                            }}
                            onError={(event) => {
                              // console.log('onError singleMediaIndex, singleMedia, event', singleMediaIndex, singleMedia, event)
                              // console.log('onError selectedOptions', selectedOptions)
                              // if (singleMediaIndex === 1) {
                              if ( singleMedia.includes('01.') ) {
                                setIsFirstUnavailable(true)
                              } else {
                                // console.log('onError Before setting media isFirstUnavailable', isFirstUnavailable)
                                setAllMedias(prevMedias => {
                                  const newMedias = [...prevMedias]
                                  newMedias[singleMediaIndex] = ""
                                  return [
                                    ...newMedias
                                  ]
                                })
                              }
                            }}
                          />
                        </a>
                      </li>
                      :
                      <li
                        className="video-thumb-container"
                        onClick={() => { handleGalleryImageClick(singleMediaIndex, singleMedia) }}
                      >
                        <div className="video-thumb-overlay"></div>
                        <img src={allMedias[0]} />
                      </li>
                    )
                  }
                </>
              )
            })}

          </ul>
        </>
        :
        (
          !!metaFieldData?.file_url && !!metaFieldData?.featured_image
          ?
          <>
            <img
              id='image-main'
              src={ metaFieldData?.file_url.split('files')[0] + metaFieldData.featured_image }
            />
          </>
          :
          ''
        )
      }
    </div>
  )
}

export default MediaWrapper