import 'mocha'

import * as request from 'supertest'

import App from '../../../../src/app'
import {
  mockInvoiceWithComplianceHashes,
  mockComplianceData,
} from '../../../../src/data/travelRuleData'
import { wrapMessage } from '../../../../src/services/signatureWrapper'
import HttpStatus from '../../../../src/types/httpStatus'
import {
  MessageType,
  AddressDetailsType,
  ComplianceType,
  PaymentSetupDetails,
} from '../../../../src/types/publicAPI'
import {
  appSetup,
  appCleanup,
  isExpectedInvoice,
} from '../../../helpers/helpers'

let app: App

describe('E2E - publicAPIRouter - GET API', function (): void {
  // Boot up Express application and initialize DB connection pool
  before(async function () {
    app = await appSetup()
  })

  it('Returns a mock invoice on GET /invoice', function (done): void {
    // GIVEN a PayID known to have a testnet address
    const payId = '/alice'
    const acceptHeader = 'application/xrpl-testnet+json'

    // This is 1 hour in milliseconds
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const TIME_TO_EXPIRY = 60 * 60 * 1000

    const expectedInvoice: PaymentSetupDetails = {
      txId: 148689,
      expirationTime: Date.now() + TIME_TO_EXPIRY,
      paymentInformation: {
        addressDetailsType: AddressDetailsType.CryptoAddress,
        addressDetails: {
          address: 'TVacixsWrqyWCr98eTYP7FSzE9NwupESR4TrnijN7fccNiS',
        },
        payId: 'alice$127.0.0.1',
      },
      complianceRequirements: [ComplianceType.TravelRule],
      complianceHashes: [],
    }
    const expectedResponse = wrapMessage(
      expectedInvoice,
      MessageType.PaymentSetupDetails,
    )

    // WHEN we make a GET request to the public endpoint to retrieve the invoice
    request(app.publicAPIExpress)
      .get(`${payId}/invoice`)
      .set('Accept', acceptHeader)
      // THEN we get back a 200 - OK with the invoice
      .expect(isExpectedInvoice(expectedResponse))
      .expect(HttpStatus.OK, done)
  })

  // TODO(dino): implement this to not use mock data
  it('Returns an updated mock invoice on POST /invoice', function (done): void {
    // GIVEN a PayID known to have a testnet address
    const payId = '/alice'
    const expectedResponse = wrapMessage(
      mockInvoiceWithComplianceHashes,
      MessageType.PaymentSetupDetails,
    )

    // WHEN we make a GET request to the public endpoint to retrieve the invoice
    request(app.publicAPIExpress)
      .post(`${payId}/invoice`)
      .send(wrapMessage(mockComplianceData, MessageType.Compliance))
      .expect('Content-Type', /json/u)
      // THEN we get back the invoice
      .expect(HttpStatus.OK, expectedResponse, done)
  })

  // Shut down Express application and close DB connections
  after(function () {
    appCleanup(app)
  })
})
