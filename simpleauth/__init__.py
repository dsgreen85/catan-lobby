import random
import string

def generate_token(token_len=40):
	alphabet = string.ascii_letters | string.digits
	return ''.join(random.choice(alphabet) for x in range(token_len))