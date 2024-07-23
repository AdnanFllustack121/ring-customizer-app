import jQuery from "jquery";
import JewelryBuilderPricingTables from "./JewelryBuilderPricingTables";

console.log('JewelryBuilderPricingTables', JewelryBuilderPricingTables)

let ringBuilder = {
  // Product Type and other product specific values, whose values are found in Shopify Product Meta Fields
  //  Settings -> Custom Data -> Products
  //  The following are the Namespace and Key to be used to access the Decimal Meta Fields:
  //      jewelrybuilderapp.premium
  //      jewelrybuilderapp.sideStoneValue
  //      jewelrybuilderapp.smallStoneWeight
  //      jewelrybuilderapp.metalWeight
  productType: null,
  premium: null,
  sideStoneValue: null,
  smallStoneWeight: null,
  metalWeight: null,

  // EXAMPLE-1 for 3 Stone ring with side stones:
  //    productType: 'Ring',
  //    premium: 0.3,
  //    sideStoneValue: 0.7,
  //    smallStoneWeight: 0.4,
  //    metalWeight: 5,

  // EXAMPLE-2 for Stud Earrings:
  //    productType: 'Earrings',
  //    premium: null,
  //    sideStoneValue: null,
  //    smallStoneWeight: null,
  //    metalWeight: 1,

  // These are the URL parameters that should be set to ringBuilder.
  //   If a param does not exist because of the product type or setup, then please set to 'na'

  url_metal_type: "na",
  url_center_stone_type: "na",
  url_center_stone_shape: "na",
  url_center_stone_weight: "na",
  url_center_stone_color: "na",
  url_center_stone_clarity: "na",
  url_center_stone_gem_quality: "na",
  url_center_stone_lab_diamond_quality: "na",
  url_side_stone_type: "na",
  url_side_stone_shape: "na",
  url_small_stone_type: "na",
  url_small_stone_shape: "na",

  // These are INTERNAL parameters for ringBuilder
  metalType: null,
  centerStoneType: null,
  centerStoneShape: null,
  centerStoneWeight: null,
  centerStoneColor: null,
  centerStoneClarity: null,
  sideStoneType: null,
  sideStoneShape: null,
  smallStoneType: null,
  smallStoneShape: null,

  jewelryVars: JewelryBuilderPricingTables.jewelryVars,

  stonePrices: JewelryBuilderPricingTables.stonePrices,

  defaultImage: "rd-di_na-na_na-na",
}


export function RingBuilderPriceCall(productType, metaFieldData, selectedOptions) {
    // Set Product Type to: 'Ring', 'Earrings', or 'Pendant'
    ringBuilder.productType = productType;

    // Set the following parameters from the Product Meta Fields from Shopify:
    //  Settings -> Custom Data -> Products
    //  The following are the Namespace and Key to be used to access the Decimal Meta Fields:
    //      jewelrybuilderapp.premium
    //      jewelrybuilderapp.sideStoneValue
    //      jewelrybuilderapp.smallStoneWeight
    //      jewelrybuilderapp.metalWeight
    ringBuilder.premium = !!metaFieldData?.premium ? Number(metaFieldData.premium) : 0
    ringBuilder.sideStoneValue = !!metaFieldData?.sideStoneValue ? Number(metaFieldData.sideStoneValue) : 0
    ringBuilder.smallStoneWeight = !!metaFieldData?.smallStoneWeight ? Number(metaFieldData.smallStoneWeight) : 0
    ringBuilder.metalWeight = !!metaFieldData?.metalWeight ? Number(metaFieldData.metalWeight) : 0

    //Set the following params directly from what is set in the URL parameters:
    const url_metal_type = Object.values(selectedOptions).find(selectedOption => selectedOption.option_slug === "metal_type")?.option_value_slug
    ringBuilder.url_metal_type = !!url_metal_type ? url_metal_type : "na"

    const url_center_stone_type = Object.values(selectedOptions).find(selectedOption => selectedOption.option_slug === "center_stone_type")?.option_value_slug
    ringBuilder.url_center_stone_type = !!url_center_stone_type ? url_center_stone_type : "na"

    const url_center_stone_shape = Object.values(selectedOptions).find(selectedOption => selectedOption.option_slug === "center_stone_shape")?.option_value_slug
    ringBuilder.url_center_stone_shape = !!url_center_stone_shape ? url_center_stone_shape : "na"

    const url_center_stone_weight = Object.values(selectedOptions).find(selectedOption => selectedOption.option_slug === "center_stone_weight")?.option_value_slug
    ringBuilder.url_center_stone_weight = !!url_center_stone_weight ? url_center_stone_weight : "na"

    const url_center_stone_color = Object.values(selectedOptions).find(selectedOption => selectedOption.option_slug === "center_stone_color")?.option_value_slug
    ringBuilder.url_center_stone_color = !!url_center_stone_color ? url_center_stone_color.toLowerCase() : "na"

    const url_center_stone_clarity = Object.values(selectedOptions).find(selectedOption => selectedOption.option_slug === "center_stone_clarity")?.option_value_slug
    ringBuilder.url_center_stone_clarity = !!url_center_stone_clarity ? url_center_stone_clarity.toLowerCase() : "na"

    const url_center_stone_gem_quality = Object.values(selectedOptions).find(selectedOption => selectedOption.option_slug === "center_stone_gem_quality")?.option_value_slug
    ringBuilder.url_center_stone_gem_quality = !!url_center_stone_gem_quality ? url_center_stone_gem_quality.toLowerCase() : "na"

    const url_center_stone_lab_diamond_quality = Object.values(selectedOptions).find(selectedOption => selectedOption.option_slug === "center_stone_lab_diamond_quality")?.option_value_slug
    ringBuilder.url_center_stone_lab_diamond_quality = !!url_center_stone_lab_diamond_quality ? url_center_stone_lab_diamond_quality.toLowerCase() : "na"

    const url_side_stone_type = Object.values(selectedOptions).find(selectedOption => selectedOption.option_slug === "side_stone_type")?.option_value_slug
    ringBuilder.url_side_stone_type = !!url_side_stone_type ? url_side_stone_type : "na"

    const url_side_stone_shape = Object.values(selectedOptions).find(selectedOption => selectedOption.option_slug === "side_stone_shape")?.option_value_slug
    ringBuilder.url_side_stone_shape = !!url_side_stone_shape ? url_side_stone_shape : "na"

    const url_small_stone_type = Object.values(selectedOptions).find(selectedOption => selectedOption.option_slug === "small_stone_type")?.option_value_slug
    ringBuilder.url_small_stone_type = !!url_small_stone_type ? url_small_stone_type : 'na'

    const url_small_stone_shape = Object.values(selectedOptions).find(selectedOption => selectedOption.option_slug === "small_stone_shape")?.option_value_slug
    ringBuilder.url_small_stone_shape = !!url_small_stone_shape ? url_small_stone_shape : 'na'


    var itemPrice = JewelryBuilderAppCalcPrice()

    // alert('Item Price is: $' + itemPrice)

    return itemPrice
}


function JewelryBuilderAppCalcPrice() {

  // Convert all the url params to values for the Jewelry Builder:
  urlParamsToRingBuilderVals(); 

  var centerStone = parseFloat(calcCenterStone(), 2);
  var sideStone   = parseFloat(calcSideStone(), 2);
  var smallStone  = parseFloat(calcSmallStone(), 2);
  var metal       = parseFloat(calcMetal(), 2);
  var premium     = parseFloat(calcPremium(), 2);


  return (centerStone + sideStone + smallStone + metal + premium); 
  
  // renderPrice(centerStone + sideStone + smallStone + metal + premium);
  // updateProductDetails();
  // updateDescription();
  // updateTotalStoneWeight();
  // updateUrl();

  // builderCurrentRing.name = $productName.text();
}


function urlParamsToRingBuilderVals() {
  // Convert all the url params to values for the Jewelry Builder:
  
  // Metal Type
  switch (ringBuilder.url_metal_type) {
    case '10k_ww':
      ringBuilder.metalType = '10k White Gold';
      break;
    case '14k_ww':
      ringBuilder.metalType = '14k White Gold';
      break;
    case '18k_ww':
      ringBuilder.metalType = '18k White Gold';
      break;
    case '10k_yy':
      ringBuilder.metalType = '10k Yellow Gold';
      break;
    case '14k_yy':
      ringBuilder.metalType = '14k Yellow Gold';
      break;
    case '18k_yy':
      ringBuilder.metalType = '18k Yellow Gold';
      break;
    case '10k_rr':
      ringBuilder.metalType = '10k Rose Gold';
      break;
    case '14k_rr':
      ringBuilder.metalType = '14k Rose Gold';
      break;
    case '18k_rr':
      ringBuilder.metalType = '18k Rose Gold';
      break;
    case 'plat':
      ringBuilder.metalType = 'Platinum';
      break;
    default:
      ringBuilder.metalType = null;
  }

  // Center Stone Type
  switch (ringBuilder.url_center_stone_type) {
    case 'di':
      ringBuilder.centerStoneType = 'diamond';
      break;
    case 'ld':
      ringBuilder.centerStoneType = 'lab diamond';
      break;
    case 'em':
      ringBuilder.centerStoneType = 'emerald';
      break;
    case 'ru':
      ringBuilder.centerStoneType = 'ruby';
      break;
    case 'bs':
      ringBuilder.centerStoneType = 'blue sapphire';
      break;
    case 'ps':
      ringBuilder.centerStoneType = 'pink sapphire';
      break;
    case 'gs':
      ringBuilder.centerStoneType = 'green sapphire';
      break;
    case 'os':
      ringBuilder.centerStoneType = 'orange sapphire';
      break;
    case 'rs':
      ringBuilder.centerStoneType = 'red sapphire';
      break;
    case 'ys':
      ringBuilder.centerStoneType = 'yellow sapphire';
      break;
    case 'am':
      ringBuilder.centerStoneType = 'amethyst';
      break;
    case 'aq':
      ringBuilder.centerStoneType = 'aquamarine';
      break;
    case 'ci':
      ringBuilder.centerStoneType = 'citrine';
      break;
    case 'bt':
      ringBuilder.centerStoneType = 'blue topaz';
      break;
    case 'ta':
      ringBuilder.centerStoneType = 'tanzanite';
      break;
    case 'de':
      ringBuilder.centerStoneType = 'diamond and emerald';
      break;
    case 'du':
      ringBuilder.centerStoneType = 'diamond and ruby';
      break;
    case 'db':
      ringBuilder.centerStoneType = 'diamond and blue sapphire';
      break;
    case 'dp':
      ringBuilder.centerStoneType = 'diamond and pink sapphire';
      break;
    case 'dg':
      ringBuilder.centerStoneType = 'diamond and green sapphire';
      break;
    case 'do':
      ringBuilder.centerStoneType = 'diamond and orange sapphire';
      break;
    case 'dr':
      ringBuilder.centerStoneType = 'diamond and red sapphire';
      break;
    case 'dy':
      ringBuilder.centerStoneType = 'diamond and yellow sapphire';
      break;
    case 'da':
      ringBuilder.centerStoneType = 'diamond and amethyst';
      break;
    case 'dq':
      ringBuilder.centerStoneType = 'diamond and aquamarine';
      break;
    case 'dc':
      ringBuilder.centerStoneType = 'diamond and citrine';
      break;
    case 'dt':
      ringBuilder.centerStoneType = 'diamond and blue topaz';
      break;
    case 'dz':
      ringBuilder.centerStoneType = 'diamond and tanzanite';
      break;
    default:
      ringBuilder.centerStoneType = null;
  }

  // Center Stone Shape
  switch (ringBuilder.url_center_stone_shape) {
    case 'rd':
      ringBuilder.centerStoneShape = 'round';
      break;
    case 'pr':
      ringBuilder.centerStoneShape = 'princess';
      break;
    case 'pe':
      ringBuilder.centerStoneShape = 'pear';
      break;
    case 'as':
      ringBuilder.centerStoneShape = 'asscher';
      break;
    case 'em':
      ringBuilder.centerStoneShape = 'emerald';
      break;
    case 'cu':
      ringBuilder.centerStoneShape = 'cushion';
      break;
    case 'mq':
      ringBuilder.centerStoneShape = 'marquise';
      break;
    case 'he':
      ringBuilder.centerStoneShape = 'heart';
      break;
    case 'ov':
      ringBuilder.centerStoneShape = 'oval';
      break;
    case 'ra':
      ringBuilder.centerStoneShape = 'radiant';
      break;
    default:
      ringBuilder.centerStoneShape = null;
  }

  // Center Stone Weight
  ringBuilder.centerStoneWeight = ringBuilder.url_center_stone_weight

  // Center Stone Color/Clarity/Lab Diamond Quality / Gem Quality
  // If the Center Stone Type is a Diamond
  if ( ringBuilder.url_center_stone_type == 'di' )
  {
      ringBuilder.centerStoneColor = ringBuilder.url_center_stone_color.toLowerCase();
      ringBuilder.centerStoneClarity = ringBuilder.url_center_stone_clarity.toLowerCase();
  }
  else
  {
      // Lab Diamond or Gem Stone

      ringBuilder.centerStoneColor = 'f';

      // If the Center Stone Type is a Lab Diamond
      if ( ringBuilder.url_center_stone_type == 'ld' )
      {
          ringBuilder.centerStoneClarity = ringBuilder.url_center_stone_lab_diamond_quality.toLowerCase(); 
      }
      else
      {
          // Gem Stone
          ringBuilder.centerStoneClarity = ringBuilder.url_center_stone_gem_quality.toLowerCase();
      }

      // Convert the Good/Excellent/Best to low/medium/high
      if ( ringBuilder.centerStoneClarity == 'good' )
      {
          ringBuilder.centerStoneClarity = 'low';
      }
      else if ( ringBuilder.centerStoneClarity == 'excellent' )
      {
          ringBuilder.centerStoneClarity = 'medium';
      }
      else if ( ringBuilder.centerStoneClarity == 'best' )
      {
          ringBuilder.centerStoneClarity = 'high';
      }
      else
      {
          // If no match then default to high
          ringBuilder.centerStoneClarity = 'high';
      }
  }

  // Side Stone Type
  switch (ringBuilder.url_side_stone_type) {
    case 'di':
      ringBuilder.sideStoneType = 'diamond';
      break;
    case 'ld':
      ringBuilder.sideStoneType = 'lab diamond';
      break;
    case 'em':
      ringBuilder.sideStoneType = 'emerald';
      break;
    case 'ru':
      ringBuilder.sideStoneType = 'ruby';
      break;
    case 'bs':
      ringBuilder.sideStoneType = 'blue sapphire';
      break;
    case 'ps':
      ringBuilder.sideStoneType = 'pink sapphire';
      break;
    case 'gs':
      ringBuilder.sideStoneType = 'green sapphire';
      break;
    case 'os':
      ringBuilder.sideStoneType = 'orange sapphire';
      break;
    case 'rs':
      ringBuilder.sideStoneType = 'red sapphire';
      break;
    case 'ys':
      ringBuilder.sideStoneType = 'yellow sapphire';
      break;
    case 'am':
      ringBuilder.sideStoneType = 'amethyst';
      break;
    case 'aq':
      ringBuilder.sideStoneType = 'aquamarine';
      break;
    case 'ci':
      ringBuilder.sideStoneType = 'citrine';
      break;
    case 'bt':
      ringBuilder.sideStoneType = 'blue topaz';
      break;
    case 'ta':
      ringBuilder.sideStoneType = 'tanzanite';
      break;
    case 'de':
      ringBuilder.sideStoneType = 'diamond and emerald';
      break;
    case 'du':
      ringBuilder.sideStoneType = 'diamond and ruby';
      break;
    case 'db':
      ringBuilder.sideStoneType = 'diamond and blue sapphire';
      break;
    case 'dp':
      ringBuilder.sideStoneType = 'diamond and pink sapphire';
      break;
    case 'dg':
      ringBuilder.sideStoneType = 'diamond and green sapphire';
      break;
    case 'do':
      ringBuilder.sideStoneType = 'diamond and orange sapphire';
      break;
    case 'dr':
      ringBuilder.sideStoneType = 'diamond and red sapphire';
      break;
    case 'dy':
      ringBuilder.sideStoneType = 'diamond and yellow sapphire';
      break;
    case 'da':
      ringBuilder.sideStoneType = 'diamond and amethyst';
      break;
    case 'dq':
      ringBuilder.sideStoneType = 'diamond and aquamarine';
      break;
    case 'dc':
      ringBuilder.sideStoneType = 'diamond and citrine';
      break;
    case 'dt':
      ringBuilder.sideStoneType = 'diamond and blue topaz';
      break;
    case 'dz':
      ringBuilder.sideStoneType = 'diamond and tanzanite';
      break;
    default:
      ringBuilder.sideStoneType = null;
  }

  // Side Stone Shape
  switch (ringBuilder.url_side_stone_shape) {
    case 'rd':
      ringBuilder.sideStoneShape = 'round';
      break;
    case 'pr':
      ringBuilder.sideStoneShape = 'princess';
      break;
    case 'pe':
      ringBuilder.sideStoneShape = 'pear';
      break;
    case 'as':
      ringBuilder.sideStoneShape = 'asscher';
      break;
    case 'em':
      ringBuilder.sideStoneShape = 'emerald';
      break;
    case 'cu':
      ringBuilder.sideStoneShape = 'cushion';
      break;
    case 'mq':
      ringBuilder.sideStoneShape = 'marquise';
      break;
    case 'he':
      ringBuilder.sideStoneShape = 'heart';
      break;
    case 'ov':
      ringBuilder.sideStoneShape = 'oval';
      break;
    case 'ra':
      ringBuilder.sideStoneShape = 'radiant';
      break;
    default:
      ringBuilder.sideStoneShape = null;
  }

  // Small Stone Type
  switch (ringBuilder.url_small_stone_type) {
    case 'di':
      ringBuilder.smallStoneType = 'diamond';
      break;
    case 'ld':
      ringBuilder.smallStoneType = 'lab diamond';
      break;
    case 'em':
      ringBuilder.smallStoneType = 'emerald';
      break;
    case 'ru':
      ringBuilder.smallStoneType = 'ruby';
      break;
    case 'bs':
      ringBuilder.smallStoneType = 'blue sapphire';
      break;
    case 'ps':
      ringBuilder.smallStoneType = 'pink sapphire';
      break;
    case 'gs':
      ringBuilder.smallStoneType = 'green sapphire';
      break;
    case 'os':
      ringBuilder.smallStoneType = 'orange sapphire';
      break;
    case 'rs':
      ringBuilder.smallStoneType = 'red sapphire';
      break;
    case 'ys':
      ringBuilder.smallStoneType = 'yellow sapphire';
      break;
    case 'am':
      ringBuilder.smallStoneType = 'amethyst';
      break;
    case 'aq':
      ringBuilder.smallStoneType = 'aquamarine';
      break;
    case 'ci':
      ringBuilder.smallStoneType = 'citrine';
      break;
    case 'bt':
      ringBuilder.smallStoneType = 'blue topaz';
      break;
    case 'ta':
      ringBuilder.smallStoneType = 'tanzanite';
      break;
    case 'de':
      ringBuilder.smallStoneType = 'diamond and emerald';
      break;
    case 'du':
      ringBuilder.smallStoneType = 'diamond and ruby';
      break;
    case 'db':
      ringBuilder.smallStoneType = 'diamond and blue sapphire';
      break;
    case 'dp':
      ringBuilder.smallStoneType = 'diamond and pink sapphire';
      break;
    case 'dg':
      ringBuilder.smallStoneType = 'diamond and green sapphire';
      break;
    case 'do':
      ringBuilder.smallStoneType = 'diamond and orange sapphire';
      break;
    case 'dr':
      ringBuilder.smallStoneType = 'diamond and red sapphire';
      break;
    case 'dy':
      ringBuilder.smallStoneType = 'diamond and yellow sapphire';
      break;
    case 'da':
      ringBuilder.smallStoneType = 'diamond and amethyst';
      break;
    case 'dq':
      ringBuilder.smallStoneType = 'diamond and aquamarine';
      break;
    case 'dc':
      ringBuilder.smallStoneType = 'diamond and citrine';
      break;
    case 'dt':
      ringBuilder.smallStoneType = 'diamond and blue topaz';
      break;
    case 'dz':
      ringBuilder.smallStoneType = 'diamond and tanzanite';
      break;
    default:
      ringBuilder.smallStoneType = null;
  }

  // Small Stone Shape
  switch (ringBuilder.url_small_stone_shape) {
    case 'rd':
      ringBuilder.smallStoneShape = 'round';
      break;
    case 'pr':
      ringBuilder.smallStoneShape = 'princess';
      break;
    case 'pe':
      ringBuilder.smallStoneShape = 'pear';
      break;
    case 'as':
      ringBuilder.smallStoneShape = 'asscher';
      break;
    case 'em':
      ringBuilder.smallStoneShape = 'emerald';
      break;
    case 'cu':
      ringBuilder.smallStoneShape = 'cushion';
      break;
    case 'mq':
      ringBuilder.smallStoneShape = 'marquise';
      break;
    case 'he':
      ringBuilder.smallStoneShape = 'heart';
      break;
    case 'ov':
      ringBuilder.smallStoneShape = 'oval';
      break;
    case 'ra':
      ringBuilder.smallStoneShape = 'radiant';
      break;
    default:
      ringBuilder.smallStoneShape = null;
  }
}


function calcCenterStone() {
  var stoneType = ringBuilder.centerStoneType;

  if (!stoneType)
      return 0;

  var shape = ringBuilder.centerStoneShape;
  var weight = ringBuilder.productType.trim().toLowerCase() == 'earrings'
      ? parseFloat(ringBuilder.centerStoneWeight/2, 2).toFixed(3)
      : parseFloat(ringBuilder.centerStoneWeight, 2).toFixed(3);

  var color = ringBuilder.centerStoneColor;
  var clarity = stoneType == 'diamond'
      ? color.concat('_', ringBuilder.centerStoneClarity)
      : ringBuilder.centerStoneClarity;

  try {
    var price = ringBuilder.stonePrices[toAscii(stoneType)][weight][clarity];

    switch (shape) {
      case 'round':
        price = parseFloat(price);
        break;

      case 'princess':
        price = parseFloat(price) * parseFloat(ringBuilder.jewelryVars.stone_shape_price_multiplier.princess);
        break;

      default:
        price = parseFloat(price) * parseFloat(ringBuilder.jewelryVars.stone_shape_price_multiplier.fancy);
    }

  } catch (e) {
    alert('Whoops, missing configuration data! No pricing for weight: ' + weight);
    console.log(stoneType, shape, weight, clarity);
    console.log(e);
  }

  return ringBuilder.productType.trim().toLowerCase() == 'earrings' ? price * 2 : price;
}


function calcSideStone() {
  var centerStoneWeight = ringBuilder.centerStoneWeight;
  var sideStoneValue = ringBuilder.sideStoneValue;
  var stonePrice = ringBuilder.jewelryVars.stone_variables.gems;

  if (!ringBuilder.sideStoneType)
      return 0;

  var foundDiamond = ringBuilder.sideStoneType.includes("diamond");

  // If the Side Stone Type is Diamond only
  if (ringBuilder.sideStoneType == 'diamond') {
      stonePrice = ringBuilder.jewelryVars.stone_variables.diamond;
  }
  // The Side Stone Type has a Diamond along with gems, eg) Diamond and Ruby
  else if (foundDiamond) {
      stonePrice = ringBuilder.jewelryVars.stone_variables.diamond_gems;
  }

  return centerStoneWeight * sideStoneValue * stonePrice;
}


function calcSmallStone() {
  var stonePrice = ringBuilder.jewelryVars.stone_variables.gems;

  if (!ringBuilder.smallStoneType)
      return 0;

  var foundDiamond = ringBuilder.smallStoneType.includes("diamond");

  // If the Small Stone Type is Diamond only
  if (ringBuilder.smallStoneType == 'diamond') {
     stonePrice = ringBuilder.jewelryVars.stone_variables.diamond;
  }
  // The Small Stone Type has a Diamond along with gems, eg) Diamond and Ruby
  else if (foundDiamond) {
      stonePrice = ringBuilder.jewelryVars.stone_variables.diamond_gems;
  }

  return ringBuilder.smallStoneWeight * stonePrice;
}


function calcMetal() {
  var argMetal = ringBuilder.metalType;
  var metalObj = jQuery.isPlainObject(argMetal) ? argMetal : breakDownMetal(argMetal);
  var value  = ringBuilder.jewelryVars.metal_variables[metalObj.purity || metalObj.name];
  var weight = ringBuilder.metalWeight || 1;

  return parseFloat(value) * parseFloat(weight);
}


function calcPremium() {
  return ringBuilder.premium * ringBuilder.jewelryVars.premium_variable;
}

function toAscii(str) {
  return str.trim().toLowerCase().replace(/(\s|-)/g, '_');
}

function breakDownMetal(str) {
  var cleanStr = str.trim().toLowerCase();
  var purity = /^\d.k/ig.exec(cleanStr);
  var name = cleanStr.replace(purity, '').trim();

  return {
      name: name,
      purity: purity ? purity[0] : null
  };
}