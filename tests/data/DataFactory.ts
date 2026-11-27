import type { IsoWeek, TestBooking, TestCredentials, TestHotel, TestUser } from '@data/types';

import { faker } from '@faker-js/faker';

const MIN_FUTURE_WEEK_OFFSET = 2;
const MAX_FUTURE_WEEK_OFFSET = 40;

export class DataFactory {
  private static uniqueId(): string {
    return `${Date.now()}-${faker.string.alphanumeric(6)}`;
  }

  private static testEmail(prefix = 'test'): string {
    const id = faker.string.alphanumeric(6).toLowerCase();
    const name = faker.person.firstName().toLowerCase();
    return `${prefix}.${name}.${id}@example.com`;
  }

  private static securePassword(): string {
    return `Test${faker.string.alphanumeric(8)}!`;
  }

  static createUser(overrides?: Partial<TestUser>): TestUser {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      email: this.testEmail(),
      password: this.securePassword(),
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      ...overrides,
    };
  }

  static createCredentials(overrides?: Partial<TestCredentials>): TestCredentials {
    return {
      email: this.testEmail(),
      password: this.securePassword(),
      ...overrides,
    };
  }

  static createTestId(prefix = 'test'): string {
    return `${prefix}-${this.uniqueId()}`;
  }

  static createHotel(overrides?: Partial<TestHotel>): TestHotel {
    return {
      name: `Test Hotel ${faker.location.city()}`,
      organizationId: faker.number.int({ min: 1, max: 100 }),
      invoiceCap: faker.number.int({ min: 1000, max: 50000 }),
      ...overrides,
    };
  }

  static createBooking(overrides?: Partial<TestBooking>): TestBooking {
    return {
      confirmationNumber: `CONF-${faker.string.alphanumeric(8).toUpperCase()}`,
      hotelId: faker.number.int({ min: 1, max: 1000 }),
      stayValue: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
      checkInDate: faker.date.future().toISOString().split('T')[0],
      emailHash: faker.string.alphanumeric(32),
      ...overrides,
    };
  }

  static futureIsoWeek(offset: number, from: Date = new Date()): IsoWeek {
    const dayMs = 86_400_000;
    const today = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
    const weekday = (new Date(today).getUTCDay() + 6) % 7;
    const monday = today - weekday * dayMs + offset * 7 * dayMs;
    const thursday = new Date(monday + 3 * dayMs);
    const isoYear = thursday.getUTCFullYear();
    const yearStart = Date.UTC(isoYear, 0, 1);
    const week = Math.floor((thursday.getTime() - yearStart) / dayMs / 7) + 1;
    return {
      semana_iso: `${isoYear}-W${String(week).padStart(2, '0')}`,
      fecha_inicio: new Date(monday).toISOString().split('T')[0],
    };
  }

  static nextIsoWeekInMadrid(now: Date = new Date()): IsoWeek {
    const { fecha_inicio } = this.currentIsoWeekInMadrid(now);
    return this.futureIsoWeek(1, new Date(`${fecha_inicio}T00:00:00Z`));
  }

  static currentIsoWeekInMadrid(now: Date = new Date()): IsoWeek {
    const madridDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    return this.futureIsoWeek(0, new Date(`${madridDate}T00:00:00Z`));
  }

  static randomFutureIsoWeek(): IsoWeek {
    return this.futureIsoWeek(faker.number.int({ min: MIN_FUTURE_WEEK_OFFSET, max: MAX_FUTURE_WEEK_OFFSET }));
  }
}

export default DataFactory;
