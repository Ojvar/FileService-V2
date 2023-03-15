.... TODO: STEP 3

# File Service


## Routine

	### TIPS
		- Using multer for managing uploaded files
		- Using Mongo ObjectId as uploaded files' name


## Steps

### Step 0:

    Check JWT token


### Step 1:

	@post('/tokens')
	User get a token

	:input (header)
		authorization	Bearer {KEYCLOAK-TOKEN}
	:input (body)
		ref		string
		allowed_files	Array<{}>
				field		string (file name)
				max_size	maximum file size (bytes)
		allowed_user	string (mongodb id)
	:output
		token		string (uuid)
		expired_at	timestamp

	:routine
        	1-1	token <- generate a token (mongodb ObjectId)
	        1-2	store token data in redis 
				key: 	token (generated in 1-1)
				value:
					created_at		timestamp
					expired_at		timestamp
					user_id			string (mongodb_id)
					allowed_file		Array[string]
					files   		Array{ file_name, size, mime, file_id (physical_name) }
					status  		ENUM[empty,has_file,saved_to_db,commited]
		1-3	send response
				token		string (mongodb ObjectId)
				expired_at	timestamp


### Step 2:
	@post('/files/{token}/{ref}
	User could upload file(s)

	:input (params)
		token	string (Step 1-1 token)
		ref	defined ref value in step 1-1
	:input (headers)
		authorization	Bearer {KEYCLOAK_TOKEN}
	:input (body)
		files	upload file/files
	:output
		200	successful
			files	Array<{}>
				field		string (field name)
				status		string (ok/nok)
				replaced_fields	Array<string>
						array of fields
		403	forbidden
		500	internal server error

	:routine
		2-1	token validation
				check token in redis
				if key was not found
					throw an error	INVALID FILE-TOKEN
	
		2-2	file-data <- fetch stored data in redis by token
		2-3	if file-data is null (token was expired or ...)
				throw an error	TOKEN IS EXPIRED
	
		2-4	user_id	<- extract user_id from jwt
		2-5	allowed_user <- get user_id from file-data (step 2-2)
		2-6	check user_id with allowed_user
				if not same
					throw an error	INVALID_USER_ID
	
		2-7	filter uploaded files
				allowd_files 	<- filter uploaded files that is in the allowd_files in the file-data 2-2
				disallowd_files	<- the remained files
		2-8	delete all files that are in the disallowd_files
		2-9	if one or more files have been replaced with old value
				delete old files

		2-10	update redis data
				merge redis allowed_files with allowed_files of step 2-4
			
### Step 3:
	@get('/tokens/uploaded/{token}/{ref}')
	Get token data (stored in redis)
	
	:input (params)
		token	string (Step 1-1 token)
		ref	defined ref value in step 1-1
	:input (headers)
		authorization	Bearer {KEYCLOAK_TOKEN}

	:output
		200	successful
			files		Array<{}>
					filename	string
					id		string (mongodb ObjectId)
					mime		string
					size		number
			created_at	timestamp
			allowed_files	Array<{}>
					field		string
					max_size	maximum file size (bytes)
			allowed_user	string (UUID)

	:routine
		3-1	token validation
				check token in redis
				if key was not found
					throw an error	INVALID FILE-TOKEN
	
		3-2	file-data <- fetch stored data in redis by token
		3-3	if file-data is null (token was expired or ...)
				throw an error	TOKEN IS EXPIRED
	
		3-4	user_id	<- extract user_id from jwt
		3-5	allowed_user <- get user_id from file-data (step 2-2)
		3-6	check user_id with allowed_user
				if not same
					throw an error	INVALID_USER_ID


### Step 3 (Commit / Reject):
	@patch('/files/{token}/{ref}')
	save all files into db


---

### Specification
    Use keycloak
        to authenticate users
    Use redis
        to store temporary data
            tokens and files list
    Use mongodb
        to store permanent data
            files data
    Use loopback-cronjob
        to check periodically

