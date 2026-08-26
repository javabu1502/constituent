// Communicating With Congress (CWC) delivery module.
//
// Build a spec-compliant XML payload (to the strict Senate schema, which the
// House also accepts) and send it through our whitelisted static IPs.
//
//   const xml = buildCwcXml(delivery);              // validate + render
//   const result = await validateHouse(delivery);   // check, nothing sent
//   const sent = await sendHouse(delivery);         // queue for delivery
//
// Required env: QUOTAGUARD_URL, CWC_DELIVERY_AGENT, CWC_ACK_EMAIL,
// CWC_CONTACT_NAME, CWC_CONTACT_EMAIL, CWC_CONTACT_PHONE, CWC_HOUSE_UAT_API_KEY
// (and CWC_HOUSE_API_KEY for production).

export * from './constants';
export * from './types';
export { buildCampaignId } from './campaign-id';
export { buildCwcXml, CwcValidationError, newDeliveryId, today, formatPhone } from './xml';
export {
  validateHouse, sendHouse, getActiveOffices,
  sendSenate, getActiveOfficesSenate,
  loadActiveOfficeCodes, sendBatch,
  checkEgressIp, type CwcResult,
} from './client';
export {
  stripSignatureBlock, blocksFederalDelivery,
  containsSignatureBlock, cwcSendableProblems, assertCwcSendable, CwcComplianceError,
} from './content';
export {
  getOrCreateDeliveryId, recordDeliveryResult, statusFromHttp, xmlSha256,
  setDeliveryLogClientFactory,
  type CwcEnvironment, type CwcDeliveryStatus, type DeliveryLogRow,
} from './delivery-log';
export {
  sendCwcDelivery, getActiveOfficeCodesCached, clearActiveOfficeCache,
  type SendCwcOptions, type SendCwcOutcome, type ActiveOfficeOptions,
} from './send';
export {
  acquireSendPermit, ratePermitScope, setRatePermitClientFactory,
  type AcquirePermitOptions,
} from './rate-permit';
export {
  resolveOfficeCode,
  houseOfficeCode,
  senateOfficeCode,
  senateSeatCodesForState,
  isValidOfficeCode,
  SENATE_SEAT_CODES,
  SENATE_TEST_OFFICE_CODES,
  type OfficeResolution,
} from './offices';
export {
  verifyConstituent,
  type VerifyResult,
  type VerifyReason,
  type ConstituentAddress,
} from './verify';
export {
  chooseDeliveryChannel,
  routeDelivery,
  type DeliveryChannel,
  type ChannelDecision,
  type RouteOptions,
} from './delivery-router';
