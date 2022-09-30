// Copyright Ojvar <MOjvar.AmirHossein@Gmail.com> 2022. All Rights Reserved.

// describe('FileManagerService', () => {
//   let app: FileServiceApplication;
//   let fileManagerService: FileManagerService;
//   const userId = 'allowed_user_id';

//   before('setupApplication', async () => {
//     ({app} = await setupApplication());
//     fileManagerService = await app.get(FILE_SERVICE_KEYS.FILE_MANAGER_SERVICE);
//   });
//   after(async () => {
//     await app.stop();
//   });

//   it('get a token from file-manager service', async () => {
//     const expireAt = +new Date() + 60000;
//     const tokenData: FILE_MANAGER_SERVICE.GetTokenRequestDTO = {
//       allowed_files: [{field: 'file1', max_size: 1024}],
//       allowed_user: userId,
//       expire_time: expireAt,
//     };

//     const result = await fileManagerService.getToken(tokenData);
//     expect(result.id).not.be.null();
//   });
// });
