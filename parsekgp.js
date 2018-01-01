module.exports = function(RED) 
{
    function ParseKgpNode(n) 
	{
        RED.nodes.createNode(this,n);
        var node = this;
		this.portNo = n.port;
		this.format = n.format;
		var Gpos = 0;
		var gPos = 7;
		var array = [];
		var udata = Buffer.alloc(256, 0);
		
		function getBits(len)
		{
			var val = Buffer.alloc(1);
		
			if ( len > gPos + 1)
			{
				let len0 = len - 1 - gPos;
				
				val[0] = udata[Gpos] << (7 - gPos);
				val[0] = val[0] >>> (8 - len);
				Gpos++
				val[0] |= udata[Gpos] >>> (8 - len0);
				gPos = 7 - len0;
			}
			else
			{
				val[0] = udata[Gpos] << (7 - gPos);
				val[0] = val[0] >>> (8- len);
				gPos -= len;
				if ( gPos < 0 )
				{
				    gPos = 7;
				    Gpos++;
				}
			}
			return val[0];
		}

		function getData(len)
		{
			var val = Buffer.alloc(4, 0);
		
			if ( len < 16 )
			{
				val[0] = getBits(len);
				return val;
			}
			else if ( len < 32 )
			{
				val[0] = getBits(8);
				val[1] = getBits(8);
				return val;
			}
			else
			{
				val[0] = getBits(8);
				val[1] = getBits(8);
				val[2] = getBits(8);
				val[3] = getBits(8);
				return val;
			}
		}

		function bool()
		{
			var val = getBits(1);
			if ( val === 0 )
			{
				array.push(false);
			}
			else
			{
				array.push(true);
			}
		}

		function uint4()
		{
			var data = getData(4);
			array.push(data.readUInt8(0));
		}

		function uint8()
		{
			var data = getData(8);
			array.push(data.readUInt8(0));
		}

		function uint16()
		{
			var data = getData(16);
			array.push(data.readUInt16BE(0));
		}

		function uint32()
		{
			var data = getData(32);
			array.push(data.readUInt32BE(0));
		}

		function int4()
		{
			var val = getBits(4);
			if ( val > 7 )
			{
				val -= 16;
			}
			array.push(val);
		}

		function int8()
		{
			var data = getData(8);
			array.push(data.readInt8(0));
		}

		function int16()
		{
			var data = getData(16);
			array.push(data.readInt16BE(0));
		}

		function int32()
		{
			var data = getData(32);
			array.push(data.readInt32BE(0));
		}

		function float()
		{
			var data = getData(32);
			array.push(data.readFloatBE(0));
		}

		function string()
		{
			var data = getData(4);
			var len = data.readUInt8(0);
			var val = Buffer.alloc(15, 0);
			for ( var i = 0; i < len; i++ )
			{
				val[i] = getBits(8);
			}
			array.push(val.toString('utf-8', 0, len));
		}

		var s = "function parsePayload(){" + this.format + "}";
		eval(s);

        node.on('input', function(msg) 
		{
			var port = msg.payload[0];

			if ( port == this.portNo )
			{
		        Gpos = 0;
				gPos = 7;
				udata = Buffer.alloc(256, 0);
			
				var data = msg.payload[1];
				var len = data.length;
				var j = 0;

				for ( var i = 0; i < len; i += 2 )
				{
				    var vhex = String(data[i]) + String(data[i+1]);
				    udata.writeUInt8(parseInt(vhex, 16), j++);
				}

				array = [];
				parsePayload();
				
		  		msg.payload = array; 
          		node.send(msg);
			}
        });
    }
    RED.nodes.registerType("parsekgp",ParseKgpNode);
}
