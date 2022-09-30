// Copyright Ojvar <MOjvar.AmirHossein@Gmail.com> 2022. All Rights Reserved.
// Node module: file-service
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {FileServiceApplication} from '../..';
import {FILE_SERVICE_KEYS} from '../../keys';
import {RedisClient} from '../../services';
import {setupApplication} from './test-helper';

describe('RedisService', () => {
  let app: FileServiceApplication;
  let redisService: RedisClient;
  const TEST_VALUE = {key: 'test_value', value: 100};

  before('setupApplication', async () => {
    ({app} = await setupApplication());
  });
  after(async () => {
    await app.stop();
  });

  it('check redis is connected to server', async () => {
    redisService = app.getSync(FILE_SERVICE_KEYS.REDIS_SERVICE);
    await redisService.connect();
    const {isOpen} = redisService;
    expect(isOpen).equal(true);
  });

  it('should be return OK after storing test-value into redis database #0', async () => {
    await redisService.SELECT(0);
    const result = await redisService.SET(TEST_VALUE.key, TEST_VALUE.value);
    expect(result).equal('OK');
  });

  it('should be return TEST_VALEU.value after fetching test-value from redis database #0', async () => {
    const result = await redisService.GET(TEST_VALUE.key);
    expect(result).equal(TEST_VALUE.value.toString());
  });

  // it('should be throw error when a key was not found', async () => {
  //   const result = await redisService.GET('INVALID_KEY');
  //   expect(result).to.alwaysThrew();
  // });

  it('check redis connection is closed', async () => {
    await redisService.disconnect();
    const {isOpen} = redisService;
    expect(isOpen).equal(false);
  });
});
